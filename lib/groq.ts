function extractErrorMessage(raw: string): string {
  let detail = raw.slice(0, 500);
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string };
    };
    if (parsed.error?.message) {
      detail = parsed.error.message;
    }
  } catch {
    /* keep raw snippet */
  }
  return detail;
}

function extractTextFromGroqChunk(parsed: unknown): string {
  if (typeof parsed !== "object" || parsed === null) return "";
  const root = parsed as Record<string, unknown>;
  const choices = root.choices;
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const firstChoice = choices[0];
  if (typeof firstChoice !== "object" || firstChoice === null) return "";
  const delta = (firstChoice as Record<string, unknown>).delta;
  if (typeof delta !== "object" || delta === null) return "";
  const text = (delta as Record<string, unknown>).content;
  return typeof text === "string" ? text : "";
}

function parseStreamLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return "";
  const payload = trimmed.slice(5).trim();
  if (!payload || payload === "[DONE]") return "";

  try {
    const parsed = JSON.parse(payload) as unknown;
    return extractTextFromGroqChunk(parsed);
  } catch {
    return "";
  }
}

export async function groqStream(
  prompt: string,
  onChunk: (text: string) => void,
  apiKey: string,
  options?: { temperature?: number; maxOutputTokens?: number },
): Promise<string> {
  const temperature = options?.temperature ?? 0.7;
  const maxCompletionTokens = options?.maxOutputTokens ?? 8192;
  const model = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_completion_tokens: maxCompletionTokens,
    }),
  });

  if (!res.ok) {
    const detail = extractErrorMessage(await res.text());
    throw new Error(`Groq error ${res.status}: ${detail}`);
  }

  if (!res.body) {
    throw new Error(`Groq stream (${model}): empty response body`);
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
      const chunk = parseStreamLine(line);
      if (!chunk) continue;
      full += chunk;
      onChunk(chunk);
    }
  }

  if (buffer.trim()) {
    const chunk = parseStreamLine(buffer);
    if (chunk) {
      full += chunk;
      onChunk(chunk);
    }
  }

  return full;
}
