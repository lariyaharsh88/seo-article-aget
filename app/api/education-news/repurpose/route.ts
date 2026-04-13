import { resolveGeminiKey } from "@/lib/api-keys";
import {
  runRepurposeForArticleId,
  runRepurposePending,
  type RepurposeProgressUpdate,
} from "@/lib/education-news/repurpose-runner";

export const runtime = "nodejs";
export const maxDuration = 120;

type StreamEvent =
  | ({
      type: "progress";
    } & RepurposeProgressUpdate)
  | {
      type: "complete";
      mode: "single" | "batch";
      id?: string;
      processed?: number;
      ids?: string[];
    }
  | { type: "error"; message: string };

function ndjsonStream(
  run: (send: (e: StreamEvent) => void) => Promise<void>,
): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const send = (e: StreamEvent) => {
        controller.enqueue(enc.encode(`${JSON.stringify(e)}\n`));
      };
      try {
        await run(send);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Repurpose failed";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });
}

export async function POST(request: Request) {
  const geminiKey = resolveGeminiKey(request);
  if (!geminiKey) {
    return new Response(
      JSON.stringify({ error: "Missing Gemini API key (header or env)." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: {
    id?: string;
    processPending?: boolean;
    limit?: number;
    stream?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (body.stream) {
    const stream = ndjsonStream(async (send) => {
      if (body.id?.trim()) {
        await runRepurposeForArticleId(body.id.trim(), geminiKey, (u) =>
          send({ type: "progress", ...u }),
        );
        send({ type: "complete", mode: "single", id: body.id.trim() });
        return;
      }
      if (body.processPending) {
        const limit =
          typeof body.limit === "number" && body.limit > 0
            ? Math.min(body.limit, 20)
            : 5;
        const out = await runRepurposePending(geminiKey, limit, (u) =>
          send({ type: "progress", ...u }),
        );
        send({
          type: "complete",
          mode: "batch",
          processed: out.processed,
          ids: out.ids,
        });
        return;
      }
      send({
        type: "error",
        message: "Provide { id } or { processPending: true } with stream: true",
      });
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  try {
    if (body.id?.trim()) {
      await runRepurposeForArticleId(body.id.trim(), geminiKey);
      return new Response(
        JSON.stringify({ ok: true, mode: "single", id: body.id.trim() }),
        { headers: { "Content-Type": "application/json" } },
      );
    }
    if (body.processPending) {
      const limit =
        typeof body.limit === "number" && body.limit > 0
          ? Math.min(body.limit, 20)
          : 5;
      const out = await runRepurposePending(geminiKey, limit);
      return new Response(
        JSON.stringify({ ok: true, mode: "batch", ...out }),
        { headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ error: "Provide { id } or { processPending: true }" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Repurpose failed";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
