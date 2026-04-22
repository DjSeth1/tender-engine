import { type NextRequest } from "next/server";
import { getRun, subscribe, type RunMessage } from "@/lib/runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/agents/runs/:runId/events
 *
 * Server-Sent Events stream of one run's events. On connect, the handler
 * replays every event already buffered on the run, emits the current state,
 * then subscribes for live updates until the run ends (or the client aborts).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { runId: string } },
) {
  const record = getRun(params.runId);
  if (!record) {
    return new Response("run not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const send = (data: RunMessage | { type: "ping"; t: number } | { type: "hello"; runId: string }) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          close();
        }
      };

      send({ type: "hello", runId: params.runId });

      for (const ev of record.events) {
        send({ type: "event", event: ev });
      }
      send({ type: "state", state: record.state, exitCode: record.exitCode });

      if (record.state !== "running") {
        close();
        return;
      }

      const unsubscribe = subscribe(params.runId, (msg) => {
        send(msg);
        if (msg.type === "state" && msg.state !== "running") {
          unsubscribe();
          close();
        }
      });

      const ping = setInterval(() => {
        send({ type: "ping", t: Date.now() });
      }, 15_000);

      req.signal.addEventListener("abort", () => {
        clearInterval(ping);
        unsubscribe();
        close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
