import { NextResponse } from "next/server";
import { buildSiteChatSystemPrompt } from "@/lib/site-chat-prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

const MAX_MESSAGES = 24;
const MAX_CONTENT_LEN = 12_000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;

type ChatMessage = { role: "user" | "assistant"; content: string };

const rateBuckets = new Map<
  string,
  { count: number; windowStart: number }
>();

function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function allowRate(key: string): boolean {
  const now = Date.now();
  let b = rateBuckets.get(key);
  if (!b || now - b.windowStart > RATE_WINDOW_MS) {
    b = { count: 0, windowStart: now };
    rateBuckets.set(key, b);
  }
  if (b.count >= RATE_MAX) return false;
  b.count += 1;
  if (rateBuckets.size > 20_000) {
    rateBuckets.clear();
  }
  return true;
}

function normalizeMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ChatMessage[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") return null;
    const role = (m as { role?: string }).role;
    const content = (m as { content?: string }).content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const trimmed = content.trim();
    if (!trimmed) continue;
    if (trimmed.length > MAX_CONTENT_LEN) return null;
    out.push({ role, content: trimmed });
  }
  if (out.length === 0) return null;
  if (out.length > MAX_MESSAGES) return null;
  if (out[0].role !== "user") return null;
  for (let i = 1; i < out.length; i++) {
    if (out[i].role === out[i - 1].role) return null;
  }
  return out;
}

export async function POST(request: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Chat is not configured (missing DEEPSEEK_API_KEY)." },
      { status: 503 },
    );
  }

  const key = getClientKey(request);
  if (!allowRate(key)) {
    return NextResponse.json(
      { error: "Too many messages. Try again in a minute." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = normalizeMessages(
    (body as { messages?: unknown })?.messages,
  );
  if (!messages) {
    return NextResponse.json(
      {
        error:
          "Invalid messages: send alternating user/assistant turns, starting with user.",
      },
      { status: 400 },
    );
  }

  const model =
    process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";

  const upstream = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: buildSiteChatSystemPrompt() },
        ...messages,
      ],
      stream: true,
      max_tokens: 1500,
      temperature: 0.5,
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    console.error("[site-chat] DeepSeek error:", upstream.status, errText);
    return NextResponse.json(
      {
        error: "Assistant could not respond. Try again shortly.",
        detail: upstream.status === 401 ? "Invalid API key" : undefined,
      },
      { status: 502 },
    );
  }

  if (!upstream.body) {
    return NextResponse.json({ error: "Empty response" }, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
