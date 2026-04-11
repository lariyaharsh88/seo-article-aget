/**
 * OpenRouter chat completions (free-tier models supported).
 * @see https://openrouter.ai/docs
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export function getOpenRouterModel(): string {
  return (
    process.env.OPENROUTER_MODEL?.trim() ||
    "mistralai/mistral-7b-instruct:free"
  );
}

export function requireOpenRouterKey(): string {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  return key;
}

export async function openRouterChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<{ content: string; model: string }> {
  const key = requireOpenRouterKey();
  const model = getOpenRouterModel();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": siteUrl,
      "X-Title": "AI SEO Toolkit",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.45,
      max_tokens: options?.maxTokens ?? 4096,
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(
      `OpenRouter error ${res.status}: ${raw.slice(0, 400)}`,
    );
  }

  let data: unknown;
  try {
    data = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("OpenRouter returned invalid JSON");
  }

  const obj = data as {
    choices?: { message?: { content?: string } }[];
  };
  const content = obj?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenRouter returned empty content");
  }

  return { content: content.trim(), model };
}
