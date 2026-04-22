/**
 * Unit tests for lib/tools/index.ts
 *
 * Written TDD-style — index.ts does not exist yet.
 * Both notion.ts and drive.ts are mocked; no real API calls are made.
 *
 * Run with:
 *   cd /Users/divijseth/Projects/tenderengine/tenderengine-cockpit && npx vitest run
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks ──────────────────────────────────────────────────────────

// "server-only" throws at import time outside a Next.js server context.
// Mock it as an empty module so the tool files can be imported in tests.
vi.mock("server-only", () => ({}));

// Mock notion.ts — return predictable data so tests can assert on it.
vi.mock("../notion", () => ({
  NOTION_TOOLS: [
    { name: "notion_get_page" },
    { name: "notion_update_page" },
    { name: "notion_append_to_page" },
  ],
  dispatchNotionTool: vi.fn(),
}));

// Mock drive.ts — return predictable data so tests can assert on it.
vi.mock("../drive", () => ({
  DRIVE_TOOLS: [
    { name: "drive_list_files" },
    { name: "drive_read_file" },
    { name: "drive_write_doc" },
    { name: "drive_update_doc" },
  ],
  dispatchDriveTool: vi.fn(),
}));

// ─── Import after mocks are registered ────────────────────────────────────
// Dynamic import is used so that vi.mock() hoisting applies correctly before
// the module under test (which does not yet exist) is resolved.

import * as notionModule from "../notion";
import * as driveModule from "../drive";

// ─── Helpers ───────────────────────────────────────────────────────────────

async function getModule() {
  // Re-import index on each test suite so mock state is fresh.
  // The actual path will be: lib/tools/index.ts
  return await import("../index");
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("ALL_TOOLS", () => {
  it("contains exactly 7 tools (3 Notion + 4 Drive)", async () => {
    const { ALL_TOOLS } = await getModule();
    expect(ALL_TOOLS).toHaveLength(7);
  });

  it("contains all 3 Notion tool names", async () => {
    const { ALL_TOOLS } = await getModule();
    const names = ALL_TOOLS.map((t: { name: string }) => t.name);
    expect(names).toContain("notion_get_page");
    expect(names).toContain("notion_update_page");
    expect(names).toContain("notion_append_to_page");
  });

  it("contains all 4 Drive tool names", async () => {
    const { ALL_TOOLS } = await getModule();
    const names = ALL_TOOLS.map((t: { name: string }) => t.name);
    expect(names).toContain("drive_list_files");
    expect(names).toContain("drive_read_file");
    expect(names).toContain("drive_write_doc");
    expect(names).toContain("drive_update_doc");
  });

  it("is a flat array (not nested)", async () => {
    const { ALL_TOOLS } = await getModule();
    for (const item of ALL_TOOLS) {
      expect(Array.isArray(item)).toBe(false);
    }
  });
});

describe("dispatch — Notion routing", () => {
  beforeEach(() => {
    vi.mocked(notionModule.dispatchNotionTool).mockResolvedValue(
      "notion_mock_result"
    );
  });

  it("routes notion_get_page to dispatchNotionTool with correct args", async () => {
    const { dispatch } = await getModule();
    const input = { page_id: "abc-123" };

    const result = await dispatch("notion_get_page", input);

    expect(notionModule.dispatchNotionTool).toHaveBeenCalledOnce();
    expect(notionModule.dispatchNotionTool).toHaveBeenCalledWith(
      "notion_get_page",
      input
    );
    expect(result).toBe("notion_mock_result");
  });

  it("routes notion_update_page to dispatchNotionTool", async () => {
    const { dispatch } = await getModule();
    const input = { page_id: "abc-123", properties: { Status: "Draft" } };

    const result = await dispatch("notion_update_page", input);

    expect(notionModule.dispatchNotionTool).toHaveBeenCalledWith(
      "notion_update_page",
      input
    );
    expect(result).toBe("notion_mock_result");
  });

  it("routes notion_append_to_page to dispatchNotionTool", async () => {
    const { dispatch } = await getModule();
    const input = { page_id: "abc-123", content: "# Heading" };

    const result = await dispatch("notion_append_to_page", input);

    expect(notionModule.dispatchNotionTool).toHaveBeenCalledWith(
      "notion_append_to_page",
      input
    );
    expect(result).toBe("notion_mock_result");
  });

  it("does not call dispatchDriveTool for a Notion tool name", async () => {
    const { dispatch } = await getModule();

    await dispatch("notion_get_page", { page_id: "x" });

    expect(driveModule.dispatchDriveTool).not.toHaveBeenCalled();
  });
});

describe("dispatch — Drive routing", () => {
  beforeEach(() => {
    vi.mocked(driveModule.dispatchDriveTool).mockResolvedValue(
      "drive_mock_result"
    );
  });

  it("routes drive_list_files to dispatchDriveTool with correct args", async () => {
    const { dispatch } = await getModule();
    const input = { folder_id: "folder-xyz" };

    const result = await dispatch("drive_list_files", input);

    expect(driveModule.dispatchDriveTool).toHaveBeenCalledOnce();
    expect(driveModule.dispatchDriveTool).toHaveBeenCalledWith(
      "drive_list_files",
      input
    );
    expect(result).toBe("drive_mock_result");
  });

  it("routes drive_update_doc to dispatchDriveTool", async () => {
    const { dispatch } = await getModule();
    const input = { file_id: "file-abc", content: "Updated content" };

    const result = await dispatch("drive_update_doc", input);

    expect(driveModule.dispatchDriveTool).toHaveBeenCalledWith(
      "drive_update_doc",
      input
    );
    expect(result).toBe("drive_mock_result");
  });

  it("does not call dispatchNotionTool for a Drive tool name", async () => {
    const { dispatch } = await getModule();
    vi.mocked(driveModule.dispatchDriveTool).mockResolvedValue("ok");

    await dispatch("drive_read_file", { file_id: "f" });

    expect(notionModule.dispatchNotionTool).not.toHaveBeenCalled();
  });
});

describe("dispatch — unknown tool names", () => {
  it("returns an error string for an unknown tool name — does not throw", async () => {
    const { dispatch } = await getModule();

    // Must not throw
    const result = await expect(
      dispatch("unknown_tool", {})
    ).resolves.toEqual(expect.any(String));

    void result; // suppress unused-variable warning
  });

  it("error string contains the unknown tool name", async () => {
    const { dispatch } = await getModule();
    const result = await dispatch("unknown_tool", {});
    expect(result).toContain("unknown_tool");
  });

  it("returns an error string for a completely unrecognised prefix", async () => {
    const { dispatch } = await getModule();
    const result = await dispatch("slack_post_message", {});
    expect(typeof result).toBe("string");
    expect(result).toContain("slack_post_message");
  });

  it("does not call either dispatcher for an unknown tool", async () => {
    const { dispatch } = await getModule();

    await dispatch("totally_unknown", {});

    expect(notionModule.dispatchNotionTool).not.toHaveBeenCalled();
    expect(driveModule.dispatchDriveTool).not.toHaveBeenCalled();
  });
});
