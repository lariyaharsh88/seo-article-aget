import { NextResponse } from "next/server";
import { resolveGroqKey } from "@/lib/api-keys";
import { buildSiteChatSystemPrompt } from "@/lib/site-chat-prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

/** OpenAI-compatible path (same as non-/v1 on DeepSeek; avoids rare proxy mismatches). */
const DEEPSEEK_URL =
  process.env.DEEPSEEK_API_BASE?.trim().replace(/\/$/, "") ||
  "https://api.deepseek.com/v1";
const DEEPSEEK_CHAT_PATH = `${DEEPSEEK_URL}/chat/completions`;
const GROQ_CHAT_PATH = "https://api.groq.com/openai/v1/chat/completions";

function sanitizeApiMessage(s: string): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length > 280) return `${t.slice(0, 277)}…`;
  return t;
}

/** Map DeepSeek HTTP errors to a short user-visible string (no stack traces). */
function deepSeekUserFacingError(status: number, bodyText: string): string {
  const raw = bodyText.trim();
  if (raw.startsWith("{")) {
    try {
      const j = JSON.parse(raw) as {
        error?: { message?: string } | string;
        message?: string;
      };
      if (typeof j.error === "object" && j.error?.message) {
        return sanitizeApiMessage(j.error.message);
      }
      if (typeof j.error === "string") return sanitizeApiMessage(j.error);
      if (typeof j.message === "string") return sanitizeApiMessage(j.message);
    } catch {
      /* use status fallbacks */
    }
  }
  if (status === 401) {
    return "Chat API key rejected. Set a valid DEEPSEEK_API_KEY on the server.";
  }
  if (status === 402) {
    return "DeepSeek account needs balance. Add credits at platform.deepseek.com.";
  }
  if (status === 429) {
    return "DeepSeek rate limit. Wait a minute and try again.";
  }
  if (status >= 500) {
    return "DeepSeek service error. Try again shortly.";
  }
  return "Assistant could not respond. Try again shortly.";
}

function groqUserFacingError(status: number, bodyText: string): string {
  const raw = bodyText.trim();
  if (raw.startsWith("{")) {
    try {
      const j = JSON.parse(raw) as {
        error?: { message?: string } | string;
        message?: string;
      };
      if (typeof j.error === "object" && j.error?.message) {
        return sanitizeApiMessage(j.error.message);
      }
      if (typeof j.error === "string") return sanitizeApiMessage(j.error);
      if (typeof j.message === "string") return sanitizeApiMessage(j.message);
    } catch {
      /* use status fallbacks */
    }
  }
  if (status === 401) {
    return "Groq API key rejected. Set a valid GROQ_API_KEY on the server.";
  }
  if (status === 429) {
    return "Groq rate limit hit. Try again in a minute.";
  }
  if (status >= 500) {
    return "Groq service error. Try again shortly.";
  }
  return "Assistant could not respond. Try again shortly.";
}

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
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY?.trim();
  const groqApiKey = resolveGroqKey(request);
  if (!deepseekApiKey && !groqApiKey) {
    return NextResponse.json(
      {
        error: "Chat is not configured (set DEEPSEEK_API_KEY or GROQ_API_KEY).",
      },
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

  const deepseekModel = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";
  const groqModel =
    process.env.GROQ_CHAT_MODEL?.trim() ||
    process.env.GROQ_MODEL?.trim() ||
    "llama-3.3-70b-versatile";
  const chatMessages = [
    { role: "system", content: buildSiteChatSystemPrompt() },
    ...messages,
  ];

  let deepSeekError: string | null = null;
  if (deepseekApiKey) {
    let upstream: Response;
    try {
      upstream = await fetch(DEEPSEEK_CHAT_PATH, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${deepseekApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: deepseekModel,
          messages: chatMessages,
          stream: true,
          max_tokens: 1500,
          temperature: 0.5,
        }),
      });
    } catch (e) {
      console.error("[site-chat] DeepSeek fetch failed:", e);
      deepSeekError =
        "Could not reach DeepSeek right now. Retrying with fallback model.";
      upstream = new Response(null, { status: 599 });
    }

    if (upstream.ok && upstream.body) {
      return new Response(upstream.body, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      console.error("[site-chat] DeepSeek error:", upstream.status, errText);
      deepSeekError = deepSeekUserFacingError(upstream.status, errText);
    } else if (!upstream.body) {
      deepSeekError = "DeepSeek returned an empty response.";
    }
  }

  if (!groqApiKey) {
    return NextResponse.json(
      {
        error: deepSeekError || "Assistant could not respond. Try again shortly.",
      },
      { status: 502 },
    );
  }

  let groqUpstream: Response;
  try {
    groqUpstream = await fetch(GROQ_CHAT_PATH, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: groqModel,
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 1500,
        temperature: 0.5,
      }),
    });
  } catch (e) {
    console.error("[site-chat] Groq fetch failed:", e);
    return NextResponse.json(
      {
        error: deepSeekError
          ? `${deepSeekError} Fallback provider failed too.`
          : "Could not reach the chat API. Check deployment network or try again.",
      },
      { status: 502 },
    );
  }

  if (!groqUpstream.ok) {
    const errText = await groqUpstream.text().catch(() => "");
    console.error("[site-chat] Groq error:", groqUpstream.status, errText);
    const fallbackError = groqUserFacingError(groqUpstream.status, errText);
    const error = deepSeekError
      ? `${deepSeekError} ${fallbackError}`
      : fallbackError;
    return NextResponse.json({ error }, { status: 502 });
  }

  if (!groqUpstream.body) {
    return NextResponse.json({ error: "Empty response" }, { status: 502 });
  }

  return new Response(groqUpstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
