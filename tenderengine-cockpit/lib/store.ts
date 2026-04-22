"use client";

import { create } from "zustand";
import type {
  AgentId,
  AgentRun,
  AgentState,
  BlockerContext,
  ChatMessage,
  CurrentDraft,
  FeedEvent,
  FeedLevel,
  PlaceholderContext,
  Section,
  Tender,
  Theme,
} from "./types";
import { sortByUrgency } from "./utils";
import {
  SEED_AGENTS,
  SEED_DRAFT,
  SEED_FEED,
  SEED_SECTIONS,
  SEED_TENDERS,
} from "./mock-data";

type Overlays = {
  newTender: boolean;
  placeholder: PlaceholderContext | null;
  blocker: BlockerContext | null;
};

type ChatState = {
  input: string;
  sending: boolean;
  history: ChatMessage[];
};

interface Store {
  user: { name: string; initials: string };

  tenders: Tender[];
  setTenders: (tenders: Tender[]) => void;
  dataSource: "snapshot" | "notion" | null;
  setDataSource: (s: "snapshot" | "notion" | null) => void;

  activeTenderId: string | null;
  setActiveTenderId: (id: string | null) => void;

  // Per-tender runtime. Keyed by tender.id. Selectors below default to empty.
  agentStatesByTender: Record<string, AgentRun[]>;
  liveEventsByTender: Record<string, FeedEvent[]>;
  /** Currently-running runId for a given (tenderId, agentId). */
  activeRunByAgent: Record<string, Partial<Record<AgentId, string>>>;

  sections: Section[];
  currentDraft: CurrentDraft;

  overlays: Overlays;
  openNewTender: () => void;
  closeOverlays: () => void;

  chat: ChatState;
  setChatInput: (v: string) => void;
  pushChatMessage: (m: ChatMessage) => void;
  setChatSending: (v: boolean) => void;

  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;

  // ── Agent actions ─────────────────────────────────────────────────────
  startAgent: (agentId: AgentId, opts?: { extra?: string; result?: string; feedback?: string }) => Promise<void>;
  cancelAgent: (agentId: AgentId) => Promise<void>;
  submitChat: () => Promise<void>;
  /** Mount an already-started run (used after /api/chat returns a run). */
  attachRun: (runId: string, tenderId: string, agentId: AgentId) => void;
  /** Server push — internal. */
  _applyEvent: (tenderId: string, ev: FeedEvent) => void;
  _applyRunState: (tenderId: string, agentId: AgentId, state: AgentState, runId: string) => void;
  _hydrateRunsForTender: (tenderId: string) => Promise<void>;
}

const initialTenders = [...SEED_TENDERS].sort((a, b) => sortByUrgency(a, b));

const T2610_ID = "3445f845-fa2b-8198-aaf4-eca677ebafb4";

/** Role metadata rehydrated when creating an idle agent slot for a new tender. */
const AGENT_METADATA: Record<AgentId, { label: string; name: string; role: string }> = {
  onboarding: {
    label: "01",
    name: "Onboarding",
    role: "Audits client Drive folder + Notion profile. Scores readiness.",
  },
  triage: {
    label: "02",
    name: "Triage",
    role: "Maps sections, detects format, flags pass/fail items, lists gaps.",
  },
  drafting: {
    label: "03",
    name: "Drafting",
    role: "Writes directly into the RFT response document.",
  },
  polish: {
    label: "04",
    name: "Polish",
    role: "Removes AI writing patterns. Em dashes, filler, banned phrases.",
  },
  debrief: {
    label: "05",
    name: "Debrief",
    role: "Post-submission. Captures result, enriches client profile.",
  },
};

const AGENT_ORDER: AgentId[] = [
  "onboarding",
  "triage",
  "drafting",
  "polish",
  "debrief",
];

function defaultAgentsFor(tenderId: string): AgentRun[] {
  if (tenderId === T2610_ID) return SEED_AGENTS;
  return AGENT_ORDER.map((id) => ({
    id,
    ...AGENT_METADATA[id],
    state: "idle",
    startedAt: null,
    finishedAt: null,
    duration: null,
    output: null,
  }));
}

function defaultEventsFor(tenderId: string): FeedEvent[] {
  return tenderId === T2610_ID ? SEED_FEED : [];
}

function nowHms() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ── Live EventSource connections, keyed by runId ──────────────────────────
// Not stored in zustand (EventSources aren't serialisable).
const liveConnections = new Map<string, EventSource>();
const attached = new Set<string>();

export const useStore = create<Store>((set, get) => ({
  user: { name: "Haarnav Mehta", initials: "HM" },

  tenders: initialTenders,
  setTenders: (tenders) =>
    set({ tenders: [...tenders].sort((a, b) => sortByUrgency(a, b)) }),
  dataSource: "snapshot",
  setDataSource: (dataSource) => set({ dataSource }),

  activeTenderId: initialTenders[0]?.id ?? null,
  setActiveTenderId: (activeTenderId) => {
    set({ activeTenderId });
    if (activeTenderId) {
      const state = get();
      if (!state.agentStatesByTender[activeTenderId]) {
        set((s) => ({
          agentStatesByTender: {
            ...s.agentStatesByTender,
            [activeTenderId]: defaultAgentsFor(activeTenderId),
          },
          liveEventsByTender: {
            ...s.liveEventsByTender,
            [activeTenderId]: defaultEventsFor(activeTenderId),
          },
        }));
      }
      void get()._hydrateRunsForTender(activeTenderId);
    }
  },

  agentStatesByTender: { [T2610_ID]: SEED_AGENTS },
  liveEventsByTender: { [T2610_ID]: SEED_FEED },
  activeRunByAgent: {},

  sections: SEED_SECTIONS,
  currentDraft: SEED_DRAFT,

  overlays: { newTender: false, placeholder: null, blocker: null },
  openNewTender: () =>
    set((s) => ({ overlays: { ...s.overlays, newTender: true } })),
  closeOverlays: () =>
    set({ overlays: { newTender: false, placeholder: null, blocker: null } }),

  chat: { input: "", sending: false, history: [] },
  setChatInput: (v) => set((s) => ({ chat: { ...s.chat, input: v } })),
  pushChatMessage: (m) =>
    set((s) => ({
      chat: { ...s.chat, history: [...s.chat.history, m] },
    })),
  setChatSending: (v) => set((s) => ({ chat: { ...s.chat, sending: v } })),

  theme: "light",
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),

  // ─────────── Internal state mutators ───────────

  _applyEvent: (tenderId, ev) =>
    set((s) => {
      const current = s.liveEventsByTender[tenderId] ?? [];
      const next = [ev, ...current].slice(0, 300);
      return {
        liveEventsByTender: { ...s.liveEventsByTender, [tenderId]: next },
      };
    }),

  _applyRunState: (tenderId, agentId, state, runId) => {
    set((s) => {
      const agents = s.agentStatesByTender[tenderId] ?? defaultAgentsFor(tenderId);
      const updated = agents.map((a) =>
        a.id === agentId
          ? {
              ...a,
              state,
              ...(state === "running"
                ? { startedAt: a.startedAt ?? new Date().toISOString(), finishedAt: null }
                : {}),
              ...(state === "done" || state === "error" || state === "idle"
                ? { finishedAt: new Date().toISOString() }
                : {}),
            }
          : a,
      );
      const active = s.activeRunByAgent[tenderId] ?? {};
      const nextActive = { ...active };
      if (state === "running") {
        nextActive[agentId] = runId;
      } else if (active[agentId] === runId) {
        delete nextActive[agentId];
      }
      return {
        agentStatesByTender: { ...s.agentStatesByTender, [tenderId]: updated },
        activeRunByAgent: { ...s.activeRunByAgent, [tenderId]: nextActive },
      };
    });
  },

  _hydrateRunsForTender: async (tenderId) => {
    try {
      const res = await fetch(`/api/agents/runs?tenderId=${tenderId}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        runs: Array<{
          runId: string;
          tenderId: string;
          agentId: AgentId;
          state: "running" | "done" | "error" | "cancelled";
          events: FeedEvent[];
        }>;
      };
      for (const r of data.runs) {
        if (r.state === "running" && !liveConnections.has(r.runId)) {
          get().attachRun(r.runId, r.tenderId, r.agentId);
        }
      }
    } catch {
      /* hydration is best-effort */
    }
  },

  // ─────────── User-facing agent actions ───────────

  startAgent: async (agentId, opts) => {
    const { activeTenderId } = get();
    if (!activeTenderId) return;
    const tenderId = activeTenderId;

    get()._applyEvent(tenderId, {
      t: nowHms(),
      agent: agentId,
      level: "info",
      message: `starting ${agentId}…`,
    });

    let runRes: Response;
    try {
      runRes = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenderId, agentId, ...opts }),
      });
    } catch (err) {
      get()._applyEvent(tenderId, {
        t: nowHms(),
        agent: agentId,
        level: "error",
        message: `failed to start: ${(err as Error).message}`,
      });
      return;
    }

    if (!runRes.ok) {
      const msg = await runRes
        .json()
        .then((j: { error?: string }) => j.error ?? `${runRes.status}`)
        .catch(() => `${runRes.status}`);
      get()._applyEvent(tenderId, {
        t: nowHms(),
        agent: agentId,
        level: "error",
        message: `failed to start: ${msg}`,
      });
      return;
    }

    const run = (await runRes.json()) as { runId: string };
    get().attachRun(run.runId, tenderId, agentId);
  },

  cancelAgent: async (agentId) => {
    const { activeTenderId, activeRunByAgent } = get();
    if (!activeTenderId) return;
    const runId = activeRunByAgent[activeTenderId]?.[agentId];
    if (!runId) return;
    try {
      await fetch(`/api/agents/runs/${runId}/cancel`, { method: "POST" });
    } catch (err) {
      get()._applyEvent(activeTenderId, {
        t: nowHms(),
        agent: agentId,
        level: "error",
        message: `cancel failed: ${(err as Error).message}`,
      });
    }
  },

  attachRun: (runId, tenderId, agentId) => {
    if (attached.has(runId)) return;
    attached.add(runId);

    // Optimistically mark the agent running so the card flips immediately.
    get()._applyRunState(tenderId, agentId, "running", runId);

    const es = new EventSource(`/api/agents/runs/${runId}/events`);
    liveConnections.set(runId, es);

    es.onmessage = (msg) => {
      let data:
        | { type: "hello"; runId: string }
        | { type: "event"; event: FeedEvent }
        | { type: "state"; state: "running" | "done" | "error" | "cancelled"; exitCode: number | null }
        | { type: "ping"; t: number };
      try {
        data = JSON.parse(msg.data);
      } catch {
        return;
      }
      if (data.type === "event") {
        get()._applyEvent(tenderId, data.event);
      } else if (data.type === "state") {
        const mapped: AgentState =
          data.state === "done"
            ? "done"
            : data.state === "error"
              ? "error"
              : data.state === "cancelled"
                ? "idle"
                : "running";
        get()._applyRunState(tenderId, agentId, mapped, runId);
        if (data.state !== "running") {
          es.close();
          liveConnections.delete(runId);
          attached.delete(runId);
        }
      }
    };

    es.onerror = () => {
      // Browser will auto-reconnect. If server closed cleanly after completion
      // the final "state" event already arrived.
    };
  },

  submitChat: async () => {
    const state = get();
    const input = state.chat.input.trim();
    if (!input || state.chat.sending) return;
    const tenderId = state.activeTenderId;

    set((s) => ({
      chat: {
        ...s.chat,
        sending: true,
        input: "",
        history: [
          ...s.chat.history,
          {
            id: crypto.randomUUID(),
            role: "user",
            content: input,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    }));

    let res: Response;
    try {
      res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, activeTenderId: tenderId }),
      });
    } catch (err) {
      get().pushChatMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: `chat failed: ${(err as Error).message}`,
        timestamp: new Date().toISOString(),
      });
      get().setChatSending(false);
      return;
    }

    if (!res.ok) {
      const msg = await res
        .json()
        .then((j: { error?: string }) => j.error ?? `${res.status}`)
        .catch(() => `${res.status}`);
      get().pushChatMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: `chat error: ${msg}`,
        timestamp: new Date().toISOString(),
      });
      get().setChatSending(false);
      return;
    }

    const data = (await res.json()) as
      | { kind: "run-started"; tenderId: string; run: { runId: string; agentId: AgentId } }
      | { kind: "cancelled"; reply: string }
      | { kind: "unresolved"; reply: string }
      | { kind: "unknown"; reply: string }
      | { kind: "error"; reply: string };

    if (data.kind === "run-started") {
      get().attachRun(data.run.runId, data.tenderId, data.run.agentId);
      if (data.tenderId !== tenderId) {
        get().setActiveTenderId(data.tenderId);
      }
      get().pushChatMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Started ${data.run.agentId}.`,
        timestamp: new Date().toISOString(),
      });
    } else {
      get().pushChatMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toISOString(),
      });
      if (tenderId) {
        get()._applyEvent(tenderId, {
          t: nowHms(),
          agent: null,
          level: data.kind === "cancelled" ? "warn" : "info",
          message: data.reply,
        });
      }
    }

    get().setChatSending(false);
  },
}));

// ─── Selectors ────────────────────────────────────────────────────────────

export const selectActiveTender = (s: Store): Tender | null =>
  s.tenders.find((t) => t.id === s.activeTenderId) ?? null;

export const selectActiveAgents = (s: Store): AgentRun[] => {
  if (!s.activeTenderId) return [];
  return s.agentStatesByTender[s.activeTenderId] ?? defaultAgentsFor(s.activeTenderId);
};

export const selectActiveEvents = (s: Store): FeedEvent[] => {
  if (!s.activeTenderId) return [];
  return s.liveEventsByTender[s.activeTenderId] ?? [];
};

export const selectActiveRunId = (
  s: Store,
  agentId: AgentId,
): string | undefined => {
  if (!s.activeTenderId) return undefined;
  return s.activeRunByAgent[s.activeTenderId]?.[agentId];
};

// Keep types stable for imports that existed pre-refactor
export type { FeedLevel } from "./types";
