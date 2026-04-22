/**
 * Agent run registry.
 *
 * Holds the live child-process for every agent run, buffers the stream-json
 * output, parses it into FeedEvents, and lets HTTP handlers subscribe for SSE.
 *
 * This module is server-only. Persisted across Next.js HMR reloads via
 * globalThis so the running process survives a route recompile.
 */

import "server-only";
import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { AgentId, FeedEvent, FeedLevel } from "./types";

export type AgentRunState = "running" | "done" | "error" | "cancelled";

export interface AgentRunRecord {
  runId: string;
  tenderId: string;
  agentId: AgentId;
  prompt: string;
  startedAt: string;
  finishedAt: string | null;
  state: AgentRunState;
  events: FeedEvent[];
  rawOutput: string;
  rawStderr: string;
  exitCode: number | null;
  child: ChildProcess | null;
  subscribers: Set<(msg: RunMessage) => void>;
}

export type RunMessage =
  | { type: "event"; event: FeedEvent }
  | { type: "state"; state: AgentRunState; exitCode: number | null };

type Registry = {
  runs: Map<string, AgentRunRecord>;
};

const globalRef = globalThis as unknown as { __teRunRegistry?: Registry };
if (!globalRef.__teRunRegistry) {
  globalRef.__teRunRegistry = { runs: new Map() };
}
const registry: Registry = globalRef.__teRunRegistry;

// ─── Helpers ───────────────────────────────────────────────────────────────

function nowHms(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function pushEvent(
  record: AgentRunRecord,
  message: string,
  level: FeedLevel = "info",
) {
  const ev: FeedEvent = {
    t: nowHms(),
    agent: record.agentId,
    level,
    message,
  };
  record.events.push(ev);
  record.subscribers.forEach((sub) => {
    try {
      sub({ type: "event", event: ev });
    } catch {
      /* dead subscriber; ignore */
    }
  });
}

function setState(
  record: AgentRunRecord,
  state: AgentRunState,
  exitCode: number | null = null,
) {
  record.state = state;
  record.exitCode = exitCode;
  if (state !== "running" && !record.finishedAt) {
    record.finishedAt = new Date().toISOString();
  }
  record.subscribers.forEach((sub) => {
    try {
      sub({ type: "state", state, exitCode });
    } catch {
      /* ignore */
    }
  });
}

function projectRoot(): string {
  const override = process.env.TENDER_ENGINE_ROOT;
  if (override) return override;
  // Next.js dev server cwd is tenderengine-cockpit/; tender-engine root is one level up.
  return path.resolve(process.cwd(), "..");
}

// ─── Spawn ────────────────────────────────────────────────────────────────

export interface StartRunOptions {
  tenderId: string;
  agentId: AgentId;
  prompt: string;
  cwd?: string;
  /** Defaults to "sonnet" for drafting-heavy agents, caller can override. */
  model?: string;
}

export function startRun(opts: StartRunOptions): AgentRunRecord {
  const runId = randomUUID();
  const record: AgentRunRecord = {
    runId,
    tenderId: opts.tenderId,
    agentId: opts.agentId,
    prompt: opts.prompt,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    state: "running",
    events: [],
    rawOutput: "",
    rawStderr: "",
    exitCode: null,
    child: null,
    subscribers: new Set(),
  };
  registry.runs.set(runId, record);

  const cwd = opts.cwd ?? projectRoot();
  const claudeBin = process.env.CLAUDE_BIN ?? "claude";
  const args = [
    "-p",
    opts.prompt,
    "--output-format",
    "stream-json",
    "--verbose",
    "--permission-mode",
    "bypassPermissions",
  ];
  if (opts.model) args.push("--model", opts.model);

  pushEvent(record, `${opts.agentId} · spawning claude (${runId.slice(0, 8)})`);

  let child: ChildProcess;
  try {
    child = spawn(claudeBin, args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    pushEvent(record, `Failed to spawn claude: ${(err as Error).message}`, "error");
    setState(record, "error");
    return record;
  }
  record.child = child;

  if (!child.stdout || !child.stderr) {
    pushEvent(record, "spawn produced no pipes", "error");
    setState(record, "error");
    return record;
  }

  let stdoutBuf = "";
  child.stdout.on("data", (chunk: Buffer) => {
    stdoutBuf += chunk.toString("utf-8");
    let idx: number;
    while ((idx = stdoutBuf.indexOf("\n")) !== -1) {
      const line = stdoutBuf.slice(0, idx).trim();
      stdoutBuf = stdoutBuf.slice(idx + 1);
      if (!line) continue;
      record.rawOutput += line + "\n";
      handleStreamLine(record, line);
    }
  });

  child.stderr.on("data", (chunk: Buffer) => {
    const text = chunk.toString("utf-8");
    record.rawStderr += text;
    const trimmed = text.trim();
    if (trimmed) {
      pushEvent(record, `stderr: ${trimmed.slice(0, 240)}`, "warn");
    }
  });

  child.on("error", (err) => {
    pushEvent(record, `Process error: ${err.message}`, "error");
    setState(record, "error");
  });

  child.on("close", (code) => {
    if (record.state === "running") {
      if (code === 0) {
        pushEvent(record, `${opts.agentId} finished cleanly`, "done");
        setState(record, "done", code);
      } else {
        pushEvent(record, `${opts.agentId} exited with code ${code}`, "error");
        setState(record, "error", code);
      }
    }
  });

  return record;
}

// ─── stream-json parser ────────────────────────────────────────────────────
// Schema reference:
//   https://docs.anthropic.com/en/docs/claude-code/sdk  (stream-json spec)
// We produce terse FeedEvents suitable for the agent-feed pane; we don't try
// to replicate the transcript.

interface StreamLine {
  type?: string;
  subtype?: string;
  message?: {
    content?: Array<{
      type?: string;
      text?: string;
      name?: string;
      input?: unknown;
    }>;
  };
  result?: string;
  cost_usd?: number;
  duration_ms?: number;
  num_turns?: number;
}

function handleStreamLine(record: AgentRunRecord, line: string) {
  let obj: StreamLine;
  try {
    obj = JSON.parse(line) as StreamLine;
  } catch {
    // Non-JSON line (shouldn't happen with stream-json, but be defensive)
    pushEvent(record, line.slice(0, 280));
    return;
  }

  const t = obj.type;
  if (t === "system" && obj.subtype === "init") {
    // The session is up; nothing user-facing to show
    return;
  }

  if (t === "assistant" && obj.message?.content) {
    for (const block of obj.message.content) {
      if (block.type === "text" && block.text) {
        const firstLine =
          block.text
            .split("\n")
            .map((s) => s.trim())
            .find((s) => s.length > 0) ?? "";
        if (firstLine) pushEvent(record, firstLine.slice(0, 280));
      } else if (block.type === "tool_use") {
        const name = block.name ?? "tool";
        const summary = summarizeToolInput(name, block.input);
        pushEvent(record, `→ ${name}${summary ? " · " + summary : ""}`);
      }
    }
    return;
  }

  if (t === "user") {
    // Tool results come back via "user" messages. These are noisy; skip.
    return;
  }

  if (t === "result") {
    const sub = obj.subtype ?? "";
    if (sub === "success" && obj.result) {
      pushEvent(record, obj.result.slice(0, 320), "done");
    } else if (sub === "error" || sub === "error_max_turns" || sub === "error_during_execution") {
      pushEvent(record, `error · ${sub}${obj.result ? " · " + obj.result.slice(0, 200) : ""}`, "error");
    }
    return;
  }
}

function summarizeToolInput(name: string, input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const obj = input as Record<string, unknown>;

  if (name.toLowerCase().includes("notion")) {
    if (typeof obj.query === "string") return `"${obj.query.slice(0, 60)}"`;
    if (typeof obj.id === "string") return obj.id.slice(0, 12);
    if (Array.isArray(obj.urls) && obj.urls.length) {
      const u = String(obj.urls[0]);
      return u.length > 40 ? "…" + u.slice(-36) : u;
    }
  }
  if (name === "Read" && typeof obj.file_path === "string") {
    const parts = obj.file_path.split("/");
    return parts.slice(-2).join("/");
  }
  if ((name === "Bash" || name === "bash") && typeof obj.description === "string") {
    return obj.description.slice(0, 80);
  }
  if (name === "Grep" && typeof obj.pattern === "string") {
    return `"${obj.pattern.slice(0, 40)}"`;
  }
  if (name === "Glob" && typeof obj.pattern === "string") {
    return obj.pattern.slice(0, 40);
  }
  if (name.includes("drive")) {
    if (typeof obj.folderId === "string") return obj.folderId.slice(0, 12);
    if (typeof obj.fileId === "string") return obj.fileId.slice(0, 12);
    if (typeof obj.folder_id === "string") return obj.folder_id.slice(0, 12);
    if (typeof obj.file_id === "string") return obj.file_id.slice(0, 12);
  }
  if (name === "Write" && typeof obj.file_path === "string") {
    return obj.file_path.split("/").slice(-2).join("/");
  }
  return "";
}

// ─── Public API ────────────────────────────────────────────────────────────

export function getRun(runId: string): AgentRunRecord | undefined {
  return registry.runs.get(runId);
}

export function listRuns(tenderId?: string): AgentRunRecord[] {
  const all: AgentRunRecord[] = [];
  registry.runs.forEach((r) => all.push(r));
  if (!tenderId) return all;
  return all.filter((r) => r.tenderId === tenderId);
}

export function cancelRun(runId: string): boolean {
  const r = registry.runs.get(runId);
  if (!r || r.state !== "running") return false;
  if (r.child && !r.child.killed) {
    r.child.kill("SIGTERM");
    setTimeout(() => {
      if (r.child && !r.child.killed) r.child.kill("SIGKILL");
    }, 3000).unref();
  }
  pushEvent(r, "Cancelled by operator", "warn");
  setState(r, "cancelled");
  return true;
}

export function subscribe(
  runId: string,
  cb: (msg: RunMessage) => void,
): () => void {
  const r = registry.runs.get(runId);
  if (!r) return () => {};
  r.subscribers.add(cb);
  return () => {
    r.subscribers.delete(cb);
  };
}

export function serializeRun(r: AgentRunRecord) {
  return {
    runId: r.runId,
    tenderId: r.tenderId,
    agentId: r.agentId,
    prompt: r.prompt,
    startedAt: r.startedAt,
    finishedAt: r.finishedAt,
    state: r.state,
    events: r.events,
    exitCode: r.exitCode,
  };
}

export type SerializedRun = ReturnType<typeof serializeRun>;
