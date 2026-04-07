/** Prefer 2.0 first on free tiers — 2.5 often hits RPM limits sooner; 429 still falls through the list. */
const MODEL_CANDIDATES = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash-001",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
];

function configuredModels(): string[] {
  const env = process.env.GEMINI_MODEL?.trim();
  if (env) return [env];
  return MODEL_CANDIDATES;
}

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

function modelUrl(
  model: string,
  method: "generateContent" | "streamGenerateContent",
  apiKey: string,
): string {
  const base = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}?key=${encodeURIComponent(apiKey)}`;
  return method === "streamGenerateContent" ? `${base}&alt=sse` : base;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postWithModelFallback(
  method: "generateContent" | "streamGenerateContent",
  apiKey: string,
  body: Record<string, unknown>,
): Promise<{ res: Response; model: string }> {
  let lastStatus = 0;
  let lastDetail = "Unknown Gemini error";
  const models = configuredModels();
  const rateLimited: string[] = [];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const res = await fetch(modelUrl(model, method, apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) return { res, model };

    const errText = await res.text();
    const detail = extractErrorMessage(errText);

    lastStatus = res.status;
    lastDetail = `${model}: ${detail}`;

    // Rate limits and missing models are often per-model — try the next candidate.
    if (res.status === 429) {
      rateLimited.push(model);
      if (i < models.length - 1) {
        await sleep(900);
      }
      continue;
    }

    if (res.status === 404) continue;

    throw new Error(`Gemini error ${res.status}: ${lastDetail}`);
  }

  if (rateLimited.length === models.length) {
    throw new Error(
      `Gemini rate limited on all tried models (${rateLimited.join(", ")}). Wait 1–2 minutes and run again, or set GEMINI_MODEL to a model with available quota.`,
    );
  }

  throw new Error(`Gemini error ${lastStatus || 404}: ${lastDetail}`);
}

function extractTextFromGeminiChunk(parsed: unknown): string {
  if (typeof parsed !== "object" || parsed === null) return "";
  const root = parsed as Record<string, unknown>;
  const candidates = root.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return "";
  const first = candidates[0];
  if (typeof first !== "object" || first === null) return "";
  const content = (first as Record<string, unknown>).content;
  if (typeof content !== "object" || content === null) return "";
  const parts = (content as Record<string, unknown>).parts;
  if (!Array.isArray(parts)) return "";

  return parts
    .map((p) => {
      if (typeof p !== "object" || p === null) return "";
      const text = (p as Record<string, unknown>).text;
      return typeof text === "string" ? text : "";
    })
    .join("");
}

function parseStreamLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return "";
  const payload = trimmed.slice(5).trim();
  if (!payload || payload === "[DONE]") return "";

  try {
    const parsed = JSON.parse(payload) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((item) => extractTextFromGeminiChunk(item)).join("");
    }
    return extractTextFromGeminiChunk(parsed);
  } catch {
    return "";
  }
}

export async function geminiStream(
  prompt: string,
  onChunk: (text: string) => void,
  apiKey: string,
  options?: { temperature?: number; maxOutputTokens?: number },
): Promise<string> {
  const temperature = options?.temperature ?? 0.7;
  const maxOutputTokens = options?.maxOutputTokens ?? 8192;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens },
  };

  const { res, model } = await postWithModelFallback(
    "streamGenerateContent",
    apiKey,
    body,
  );

  if (!res.body) {
    throw new Error(`Gemini stream (${model}): empty response body`);
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

export async function geminiText(
  prompt: string,
  apiKey: string,
  options?: { temperature?: number; maxOutputTokens?: number },
): Promise<string> {
  const temperature = options?.temperature ?? 0.5;
  const maxOutputTokens = options?.maxOutputTokens ?? 8192;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens },
  };

  const { res } = await postWithModelFallback("generateContent", apiKey, body);

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    promptFeedback?: { blockReason?: string };
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text.trim() && data.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked the prompt: ${data.promptFeedback.blockReason}`);
  }

  return text;
}

export async function geminiJSON<T>(
  prompt: string,
  apiKey: string,
  options?: { temperature?: number; maxOutputTokens?: number },
): Promise<T> {
  const temperature = options?.temperature ?? 0.3;
  const maxOutputTokens = options?.maxOutputTokens ?? 8192;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType: "application/json",
    },
  };

  const { res } = await postWithModelFallback("generateContent", apiKey, body);

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned an empty JSON response.");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Gemini returned malformed JSON.");
  }
}
