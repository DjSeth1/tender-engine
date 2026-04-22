import { NOTION_TOOLS, dispatchNotionTool } from "./notion";
import { DRIVE_TOOLS, dispatchDriveTool } from "./drive";

export const ALL_TOOLS = [...NOTION_TOOLS, ...DRIVE_TOOLS];

export async function dispatch(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  if (name.startsWith("notion_")) {
    return dispatchNotionTool(name, input);
  }
  if (name.startsWith("drive_")) {
    return dispatchDriveTool(name, input);
  }
  return `Unknown tool: ${name}`;
}
