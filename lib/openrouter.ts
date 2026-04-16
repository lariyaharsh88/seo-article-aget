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

function extractErrorMessage(raw: string): string {
  let detail = raw.slice(0, 500);
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string };
    };
    if (parsed.error?.message) detail = parsed.error.message;
  } catch {
    /* keep raw snippet */
  }
  return detail;
}

function streamTextFromPayload(payload: string): string {
  if (!payload || payload === "[DONE]") return "";
  try {
    const parsed = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    return parsed.choices?.[0]?.delta?.content ?? "";
  } catch {
    return "";
  }
}

export async function openRouterChatWithKey(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  apiKey: string,
  options?: { temperature?: number; maxTokens?: number },
): Promise<{ content: string; model: string }> {
  const model = getOpenRouterModel();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
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

export async function openRouterChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<{ content: string; model: string }> {
  return openRouterChatWithKey(messages, requireOpenRouterKey(), options);
}

export async function openRouterStream(
  prompt: string,
  onChunk: (text: string) => void,
  apiKey: string,
  options?: { temperature?: number; maxOutputTokens?: number },
): Promise<string> {
  const model = getOpenRouterModel();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": siteUrl,
      "X-Title": "AI SEO Toolkit",
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: "user", content: prompt }],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxOutputTokens ?? 8192,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `OpenRouter error ${res.status}: ${extractErrorMessage(await res.text())}`,
    );
  }
  if (!res.body) {
    throw new Error(`OpenRouter stream (${model}): empty response body`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const chunk = streamTextFromPayload(trimmed.slice(5).trim());
      if (!chunk) continue;
      full += chunk;
      onChunk(chunk);
    }
  }

  if (buffer.trim().startsWith("data:")) {
    const chunk = streamTextFromPayload(buffer.trim().slice(5).trim());
    if (chunk) {
      full += chunk;
      onChunk(chunk);
    }
  }

  return full;
}
