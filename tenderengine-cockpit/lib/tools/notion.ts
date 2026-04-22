/**
 * Notion tool handlers for the SDK agent loop.
 *
 * Replaces the Notion MCP server that Claude Code CLI used locally.
 * Three tools cover everything the agents need:
 *   notion_get_page      — read properties + body of any page
 *   notion_update_page   — update named properties on a page
 *   notion_append_to_page — append markdown content to a page body
 *
 * The agent always starts from a page URL or ID given in the prompt.
 * Relations (e.g. tender → client) surface as page IDs in the properties
 * output so the agent can fetch linked pages with a second call.
 */

import "server-only";
import { Client, isFullPage, isFullBlock } from "@notionhq/client";
import type {
  PageObjectResponse,
  BlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

// ─── Client ────────────────────────────────────────────────────────────────

function getClient(): Client {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN env var is not set");
  return new Client({ auth: token });
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Extract a plain 32-char page ID from a Notion URL or pass-through if already an ID. */
function extractPageId(input: string): string {
  // Full UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const uuidMatch = input.match(
    /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
  );
  if (uuidMatch) return uuidMatch[1];

  // Compact 32-char hex at end of URL: ...PageName-abcdef1234567890abcdef1234567890
  const compactMatch = input.match(/([0-9a-f]{32})(?:[^0-9a-f]|$)/i);
  if (compactMatch) return compactMatch[1];

  // Assume it's already a plain ID
  return input.trim();
}

/** Pull plain text out of a Notion rich text array. */
function richTextToPlain(rt: RichTextItemResponse[]): string {
  return rt
    .map((r) => ("plain_text" in r ? r.plain_text : ""))
    .join("");
}

/** Read all blocks from a page, paginating automatically. */
async function getAllBlocks(
  notion: Client,
  blockId: string
): Promise<BlockObjectResponse[]> {
  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const b of res.results) {
      if (isFullBlock(b)) blocks.push(b);
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return blocks;
}

/** Convert a Notion block to a plain text line. Handles the types agents care about. */
function blockToText(block: BlockObjectResponse): string {
  const type = block.type;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (block as any)[type];

  const text = (rt: RichTextItemResponse[] | undefined) =>
    rt ? richTextToPlain(rt) : "";

  switch (type) {
    case "heading_1":    return `# ${text(data?.rich_text)}`;
    case "heading_2":    return `## ${text(data?.rich_text)}`;
    case "heading_3":    return `### ${text(data?.rich_text)}`;
    case "paragraph":    return text(data?.rich_text);
    case "bulleted_list_item": return `- ${text(data?.rich_text)}`;
    case "numbered_list_item": return `1. ${text(data?.rich_text)}`;
    case "to_do":        return `[${data?.checked ? "x" : " "}] ${text(data?.rich_text)}`;
    case "quote":        return `> ${text(data?.rich_text)}`;
    case "code":         return `\`\`\`\n${text(data?.rich_text)}\n\`\`\``;
    case "divider":      return "---";
    case "callout":      return `> ${text(data?.rich_text)}`;
    default:             return text(data?.rich_text) ?? "";
  }
}

/** Convert a Notion page's properties to a readable summary string. */
function propertiesToText(page: PageObjectResponse): string {
  const lines: string[] = [];

  for (const [name, prop] of Object.entries(page.properties)) {
    let value = "";
    switch (prop.type) {
      case "title":
        value = richTextToPlain(prop.title);
        break;
      case "rich_text":
        value = richTextToPlain(prop.rich_text);
        break;
      case "select":
        value = prop.select?.name ?? "";
        break;
      case "multi_select":
        value = prop.multi_select.map((s) => s.name).join(", ");
        break;
      case "number":
        value = prop.number !== null ? String(prop.number) : "";
        break;
      case "date":
        value = prop.date?.start ?? "";
        break;
      case "checkbox":
        value = prop.checkbox ? "true" : "false";
        break;
      case "url":
        value = prop.url ?? "";
        break;
      case "email":
        value = prop.email ?? "";
        break;
      case "phone_number":
        value = prop.phone_number ?? "";
        break;
      case "relation":
        value = prop.relation.map((r) => r.id).join(", ");
        break;
      case "formula":
        if (prop.formula.type === "string") value = prop.formula.string ?? "";
        else if (prop.formula.type === "number") value = String(prop.formula.number);
        else if (prop.formula.type === "boolean") value = String(prop.formula.boolean);
        else if (prop.formula.type === "date") value = prop.formula.date?.start ?? "";
        break;
      case "rollup":
        if (prop.rollup.type === "number") value = String(prop.rollup.number ?? "");
        else if (prop.rollup.type === "array")
          value = prop.rollup.array.length + " items";
        break;
      default:
        value = "";
    }
    if (value) lines.push(`${name}: ${value}`);
  }

  return lines.join("\n");
}

/**
 * Convert a plain text/markdown string into Notion block objects.
 * Handles headings, bullets, numbered lists, to-dos, dividers, code blocks,
 * and paragraphs. Sufficient for everything the agents write.
 */
function textToBlocks(content: string) {
  const lines = content.split("\n");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blocks: any[] = [];
  let i = 0;

  const rt = (text: string) => [
    { type: "text" as const, text: { content: text } },
  ];

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: "code",
        code: { rich_text: rt(codeLines.join("\n")), language: "plain text" },
      });
      i++;
      continue;
    }

    if (line.startsWith("# "))
      blocks.push({ type: "heading_1", heading_1: { rich_text: rt(line.slice(2)) } });
    else if (line.startsWith("## "))
      blocks.push({ type: "heading_2", heading_2: { rich_text: rt(line.slice(3)) } });
    else if (line.startsWith("### "))
      blocks.push({ type: "heading_3", heading_3: { rich_text: rt(line.slice(4)) } });
    else if (line.startsWith("- "))
      blocks.push({ type: "bulleted_list_item", bulleted_list_item: { rich_text: rt(line.slice(2)) } });
    else if (/^\d+\. /.test(line))
      blocks.push({ type: "numbered_list_item", numbered_list_item: { rich_text: rt(line.replace(/^\d+\. /, "")) } });
    else if (line.startsWith("[ ] ") || line.startsWith("[x] "))
      blocks.push({ type: "to_do", to_do: { rich_text: rt(line.slice(4)), checked: line.startsWith("[x]") } });
    else if (line.startsWith("> "))
      blocks.push({ type: "quote", quote: { rich_text: rt(line.slice(2)) } });
    else if (line === "---")
      blocks.push({ type: "divider", divider: {} });
    else
      blocks.push({ type: "paragraph", paragraph: { rich_text: rt(line) } });

    i++;
  }

  return blocks;
}

/**
 * Format a property value for a Notion pages.update() call.
 * Inspects the existing property type so the agent can pass plain values.
 */
function formatPropertyUpdate(
  existingProp: PageObjectResponse["properties"][string],
  value: unknown
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const str = String(value);
  switch (existingProp.type) {
    case "title":
      return { title: [{ text: { content: str } }] };
    case "rich_text":
      return { rich_text: [{ text: { content: str } }] };
    case "select":
      return { select: { name: str } };
    case "multi_select":
      return {
        multi_select: str
          .split(",")
          .map((s) => ({ name: s.trim() }))
          .filter((s) => s.name),
      };
    case "number":
      return { number: typeof value === "number" ? value : parseFloat(str) };
    case "date":
      return { date: { start: str } };
    case "checkbox":
      return { checkbox: value === true || str === "true" };
    case "url":
      return { url: str };
    case "email":
      return { email: str };
    case "phone_number":
      return { phone_number: str };
    default:
      return { rich_text: [{ text: { content: str } }] };
  }
}

// ─── Tool handlers ─────────────────────────────────────────────────────────

/**
 * Read a Notion page — returns all properties and the full page body as
 * plain text. Relations surface as page IDs so the agent can fetch them.
 */
export async function notion_get_page(input: {
  page_id: string;
}): Promise<string> {
  const notion = getClient();
  const id = extractPageId(input.page_id);

  const [page, blocks] = await Promise.all([
    notion.pages.retrieve({ page_id: id }),
    getAllBlocks(notion, id),
  ]);

  if (!isFullPage(page)) return "Error: could not retrieve full page object.";

  const title =
    Object.values(page.properties).find((p) => p.type === "title")
      ? richTextToPlain(
          (Object.values(page.properties).find((p) => p.type === "title") as { title: RichTextItemResponse[] })!.title
        )
      : id;

  const bodyLines = blocks
    .map(blockToText)
    .filter((l) => l !== null && l !== undefined);

  return [
    `=== NOTION PAGE: ${title} ===`,
    `PAGE ID: ${id}`,
    `URL: ${page.url}`,
    "",
    "PROPERTIES:",
    propertiesToText(page),
    "",
    "PAGE BODY:",
    ...bodyLines,
  ].join("\n");
}

/**
 * Update named properties on a Notion page.
 * Pass a plain object — the handler resolves each property type automatically.
 * Example: { "Status": "Review", "Sections Found": 14, "Agent Notes": "..." }
 */
export async function notion_update_page(input: {
  page_id: string;
  properties: Record<string, unknown>;
}): Promise<string> {
  const notion = getClient();
  const id = extractPageId(input.page_id);

  // Fetch current page to discover property types
  const page = await notion.pages.retrieve({ page_id: id });
  if (!isFullPage(page)) return "Error: could not retrieve full page object.";

  const updates: Record<string, unknown> = {};
  const skipped: string[] = [];

  for (const [name, value] of Object.entries(input.properties)) {
    const existing = page.properties[name];
    if (!existing) {
      skipped.push(name);
      continue;
    }
    updates[name] = formatPropertyUpdate(existing, value);
  }

  await notion.pages.update({
    page_id: id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties: updates as any,
  });

  const updated = Object.keys(updates).join(", ");
  return skipped.length
    ? `Updated: ${updated}. Skipped (property not found): ${skipped.join(", ")}.`
    : `Updated: ${updated}.`;
}

/**
 * Append markdown content to the body of a Notion page.
 * Converts headings, bullets, numbered lists, to-dos, dividers, code blocks,
 * and paragraphs. Content is always appended — existing body is never overwritten.
 * Notion limits appending to 100 blocks per call; this handler chunks automatically.
 */
export async function notion_append_to_page(input: {
  page_id: string;
  content: string;
}): Promise<string> {
  const notion = getClient();
  const id = extractPageId(input.page_id);
  const blocks = textToBlocks(input.content);

  // Notion API: max 100 blocks per append call
  const CHUNK = 100;
  let appended = 0;
  for (let i = 0; i < blocks.length; i += CHUNK) {
    await notion.blocks.children.append({
      block_id: id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children: blocks.slice(i, i + CHUNK) as any,
    });
    appended += Math.min(CHUNK, blocks.length - i);
  }

  return `Appended ${appended} block(s) to page ${id}.`;
}

// ─── Anthropic tool definitions ────────────────────────────────────────────

export const NOTION_TOOLS = [
  {
    name: "notion_get_page",
    description:
      "Read a Notion page. Returns all properties and the full page body as plain text. " +
      "Pass a Notion page URL or page ID. Relations (e.g. tender → client) appear as " +
      "page IDs in the properties output — use another notion_get_page call to fetch them.",
    input_schema: {
      type: "object" as const,
      properties: {
        page_id: {
          type: "string",
          description: "Notion page URL or page ID.",
        },
      },
      required: ["page_id"],
    },
  },
  {
    name: "notion_update_page",
    description:
      "Update properties on a Notion page. Pass a plain key-value object where keys are " +
      "the exact property names as they appear in Notion and values are plain strings or " +
      "numbers. The handler resolves each property type automatically. " +
      "Example: { \"Status\": \"Review\", \"Sections Found\": 14 }",
    input_schema: {
      type: "object" as const,
      properties: {
        page_id: {
          type: "string",
          description: "Notion page URL or page ID.",
        },
        properties: {
          type: "object",
          description:
            "Key-value pairs of property name to new value. Keys must match " +
            "exact Notion property names. Values are plain strings or numbers.",
          additionalProperties: true,
        },
      },
      required: ["page_id", "properties"],
    },
  },
  {
    name: "notion_append_to_page",
    description:
      "Append content to the body of a Notion page. Accepts plain text or markdown: " +
      "# Heading 1, ## Heading 2, ### Heading 3, - bullet, 1. numbered, [ ] to-do, " +
      "[x] checked to-do, > quote, ``` code block, --- divider, plain text paragraphs. " +
      "Content is always appended — existing body is never overwritten.",
    input_schema: {
      type: "object" as const,
      properties: {
        page_id: {
          type: "string",
          description: "Notion page URL or page ID.",
        },
        content: {
          type: "string",
          description: "Plain text or markdown content to append to the page body.",
        },
      },
      required: ["page_id", "content"],
    },
  },
] as const;

// ─── Dispatch ──────────────────────────────────────────────────────────────

export async function dispatchNotionTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case "notion_get_page":
      return notion_get_page(input as { page_id: string });
    case "notion_update_page":
      return notion_update_page(
        input as { page_id: string; properties: Record<string, unknown> }
      );
    case "notion_append_to_page":
      return notion_append_to_page(
        input as { page_id: string; content: string }
      );
    default:
      return `Unknown Notion tool: ${name}`;
  }
}
