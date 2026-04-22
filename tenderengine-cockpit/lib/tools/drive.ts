/**
 * Google Drive tool handlers for the SDK agent loop.
 *
 * Replaces the Google Drive MCP server that Claude Code CLI used locally.
 * Auth uses a service account JSON stored in GOOGLE_SERVICE_ACCOUNT_JSON.
 * The service account must have Editor access to the TenderEngine Drive folder.
 *
 * Four tools:
 *   drive_list_files  — list files in a folder
 *   drive_read_file   — read any file (Docs, Sheets, PDF, Word, plain text)
 *   drive_write_doc   — create a new Google Doc, or update one by name
 *   drive_update_doc  — overwrite an existing Google Doc by file ID
 */

import "server-only";
import { google } from "googleapis";
import type { docs_v1 } from "googleapis";

// ─── Auth ──────────────────────────────────────────────────────────────────

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON env var is not set");

  let credentials: object;
  try {
    credentials = JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/documents",
    ],
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Extract a file/folder ID from a Drive URL or pass through if already an ID.
 * Handles:
 *   https://docs.google.com/document/d/FILE_ID/edit
 *   https://drive.google.com/file/d/FILE_ID/view
 *   https://drive.google.com/drive/folders/FOLDER_ID
 */
function extractId(input: string): string {
  const match =
    input.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return input.trim();
}

/** Overwrite the body of an existing Google Doc with new plain text content. */
async function overwriteDocContent(
  docs: docs_v1.Docs,
  fileId: string,
  content: string
): Promise<void> {
  const doc = await docs.documents.get({ documentId: fileId });
  const bodyContent = doc.data.body?.content ?? [];
  const lastEl = bodyContent[bodyContent.length - 1];
  const endIndex = (lastEl?.endIndex ?? 1) as number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requests: any[] = [];

  if (endIndex > 1) {
    requests.push({
      deleteContentRange: { range: { startIndex: 1, endIndex: endIndex - 1 } },
    });
  }

  if (content.trim()) {
    requests.push({ insertText: { location: { index: 1 }, text: content } });
  }

  if (requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId: fileId,
      requestBody: { requests },
    });
  }
}

// ─── Tool handlers ─────────────────────────────────────────────────────────

/** List all files in a Google Drive folder. */
export async function drive_list_files(input: {
  folder_id: string;
}): Promise<string> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });
  const folderId = extractId(input.folder_id);

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id,name,mimeType,size,modifiedTime,webViewLink)",
    orderBy: "name",
    pageSize: 100,
  });

  const files = res.data.files ?? [];
  if (files.length === 0) return `No files found in folder ${folderId}.`;

  const lines = files.map(
    (f) =>
      `- ${f.name}\n  ID: ${f.id}\n  Type: ${f.mimeType}\n  Modified: ${f.modifiedTime?.slice(0, 10)}\n  Link: ${f.webViewLink}`
  );

  return `Files in folder ${folderId} (${files.length} total):\n\n${lines.join("\n\n")}`;
}

/**
 * Read the text content of a file in Google Drive.
 * Supports: Google Docs (plain text export), Google Sheets (CSV export),
 * PDF (pdf-parse), Word (.docx, mammoth), plain text files.
 */
export async function drive_read_file(input: {
  file_id: string;
}): Promise<string> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });
  const fileId = extractId(input.file_id);

  const meta = await drive.files.get({
    fileId,
    fields: "id,name,mimeType,webViewLink",
  });
  const mimeType = meta.data.mimeType ?? "";
  const name = meta.data.name ?? fileId;

  // Google Doc → plain text export
  if (mimeType === "application/vnd.google-apps.document") {
    const res = await drive.files.export(
      { fileId, mimeType: "text/plain" },
      { responseType: "text" }
    );
    return `=== ${name} ===\nLink: ${meta.data.webViewLink}\n\n${res.data as string}`;
  }

  // Google Sheet → CSV export
  if (mimeType === "application/vnd.google-apps.spreadsheet") {
    const res = await drive.files.export(
      { fileId, mimeType: "text/csv" },
      { responseType: "text" }
    );
    return `=== ${name} (spreadsheet) ===\nLink: ${meta.data.webViewLink}\n\n${res.data as string}`;
  }

  // Download raw bytes for everything else
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );
  const buffer = Buffer.from(res.data as ArrayBuffer);

  // PDF
  if (mimeType === "application/pdf") {
    try {
      // Dynamic import avoids build-time issues with the pdf-parse binary
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
      const parsed = await pdfParse(buffer);
      return `=== ${name} (PDF, ${parsed.numpages} pages) ===\nLink: ${meta.data.webViewLink}\n\n${parsed.text}`;
    } catch (err) {
      return `=== ${name} ===\n[PDF text extraction failed: ${(err as Error).message}. File ID: ${fileId}]`;
    }
  }

  // Word (.docx)
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return `=== ${name} (Word document) ===\nLink: ${meta.data.webViewLink}\n\n${result.value}`;
    } catch (err) {
      return `=== ${name} ===\n[Word document text extraction failed: ${(err as Error).message}. File ID: ${fileId}]`;
    }
  }

  // Plain text
  if (mimeType.startsWith("text/")) {
    return `=== ${name} ===\nLink: ${meta.data.webViewLink}\n\n${buffer.toString("utf-8")}`;
  }

  return `=== ${name} ===\n[File type ${mimeType} is not supported for text extraction. File ID: ${fileId}, Size: ${buffer.length} bytes]`;
}

/**
 * Create a Google Doc in a Drive folder, or update it if a doc with the same
 * title already exists in that folder. Returns the file ID and link.
 */
export async function drive_write_doc(input: {
  folder_id: string;
  title: string;
  content: string;
}): Promise<string> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });
  const docs = google.docs({ version: "v1", auth });
  const folderId = extractId(input.folder_id);

  // Check for existing doc with same name
  const escapedTitle = input.title.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const existing = await drive.files.list({
    q: `name = '${escapedTitle}' and '${folderId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.document'`,
    fields: "files(id,name,webViewLink)",
    pageSize: 1,
  });

  if (existing.data.files && existing.data.files.length > 0) {
    const fileId = existing.data.files[0].id!;
    const link = existing.data.files[0].webViewLink!;
    await overwriteDocContent(docs, fileId, input.content);
    return `Updated existing Google Doc: ${input.title}\nID: ${fileId}\nLink: ${link}`;
  }

  // Create new doc
  const file = await drive.files.create({
    requestBody: {
      name: input.title,
      mimeType: "application/vnd.google-apps.document",
      parents: [folderId],
    },
    fields: "id,webViewLink",
  });

  const fileId = file.data.id!;
  await overwriteDocContent(docs, fileId, input.content);

  return `Created Google Doc: ${input.title}\nID: ${fileId}\nLink: ${file.data.webViewLink}`;
}

/**
 * Overwrite the content of an existing Google Doc by file ID.
 * Used by the Polish agent to write polished content back to the draft doc.
 */
export async function drive_update_doc(input: {
  file_id: string;
  content: string;
}): Promise<string> {
  const auth = getAuth();
  const docs = google.docs({ version: "v1", auth });
  const drive = google.drive({ version: "v3", auth });
  const fileId = extractId(input.file_id);

  const meta = await drive.files.get({ fileId, fields: "name,webViewLink" });
  await overwriteDocContent(docs, fileId, input.content);

  return `Updated Google Doc: ${meta.data.name}\nID: ${fileId}\nLink: ${meta.data.webViewLink}`;
}

// ─── Anthropic tool definitions ────────────────────────────────────────────

export const DRIVE_TOOLS = [
  {
    name: "drive_list_files",
    description:
      "List all files in a Google Drive folder. Returns file names, IDs, types, " +
      "last modified dates, and links. Pass a Drive folder URL or folder ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        folder_id: {
          type: "string",
          description: "Google Drive folder URL or folder ID.",
        },
      },
      required: ["folder_id"],
    },
  },
  {
    name: "drive_read_file",
    description:
      "Read the text content of a file in Google Drive. Supports Google Docs " +
      "(exported as plain text), Google Sheets (exported as CSV), PDFs, Word " +
      "documents (.docx), and plain text files. Pass a file URL or file ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        file_id: {
          type: "string",
          description: "Google Drive file URL or file ID.",
        },
      },
      required: ["file_id"],
    },
  },
  {
    name: "drive_write_doc",
    description:
      "Create a Google Doc in a Drive folder. If a doc with the same title already " +
      "exists in that folder, its content is replaced. Returns the file ID and link. " +
      "Use this when creating triage reports, draft responses, and submission checklists.",
    input_schema: {
      type: "object" as const,
      properties: {
        folder_id: {
          type: "string",
          description: "Google Drive folder URL or folder ID to create the doc in.",
        },
        title: {
          type: "string",
          description: "Title of the Google Doc (e.g. 'DRAFT RESPONSE — T26/10').",
        },
        content: {
          type: "string",
          description: "Plain text content to write into the document.",
        },
      },
      required: ["folder_id", "title", "content"],
    },
  },
  {
    name: "drive_update_doc",
    description:
      "Overwrite the content of an existing Google Doc by file ID or URL. " +
      "Use this when updating a draft after new client information arrives, " +
      "or when the Polish agent writes polished content back to the draft.",
    input_schema: {
      type: "object" as const,
      properties: {
        file_id: {
          type: "string",
          description: "Google Drive file URL or file ID of the doc to update.",
        },
        content: {
          type: "string",
          description: "New plain text content to replace the document body with.",
        },
      },
      required: ["file_id", "content"],
    },
  },
] as const;

// ─── Dispatch ──────────────────────────────────────────────────────────────

export async function dispatchDriveTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case "drive_list_files":
      return drive_list_files(input as { folder_id: string });
    case "drive_read_file":
      return drive_read_file(input as { file_id: string });
    case "drive_write_doc":
      return drive_write_doc(
        input as { folder_id: string; title: string; content: string }
      );
    case "drive_update_doc":
      return drive_update_doc(
        input as { file_id: string; content: string }
      );
    default:
      return `Unknown Drive tool: ${name}`;
  }
}
