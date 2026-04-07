/** Prefer 2.0 first on free tiers — 2.5 often hits RPM limits sooner; 429 still falls through the list. */
const MODEL_CANDIDATES = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash-001",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro-latest",
  "gemini-1.5-pro",
];

/**
 * If `GEMINI_MODEL` is set (e.g. on Vercel), that model is tried **first** only.
 * On 429/404 we still fall through other IDs — never lock to a single ID forever.
 */
function configuredModels(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const out: string[] = [];
  if (preferred) out.push(preferred);
  for (const m of MODEL_CANDIDATES) {
    if (!out.includes(m)) out.push(m);
  }
  return out;
}

interface ListedModel {
  name?: string;
  supportedGenerationMethods?: string[];
}

const MODEL_LIST_TTL_MS = 10 * 60 * 1000;
const modelListCache = new Map<
  string,
  { ids: string[]; fetchedAt: number }
>();

function cacheKeyForList(apiKey: string, forStream: boolean): string {
  return `${forStream ? "s" : "g"}:${apiKey.slice(0, 12)}`;
}

/**
 * Uses ListModels so the API key's actual catalog wins over stale hardcoded names.
 * Same prompts — only routing changes — so article/outline quality stays consistent.
 */
async function discoverModelIds(
  apiKey: string,
  forStream: boolean,
): Promise<string[]> {
  const ck = cacheKeyForList(apiKey, forStream);
  const hit = modelListCache.get(ck);
  if (hit && Date.now() - hit.fetchedAt < MODEL_LIST_TTL_MS) {
    return hit.ids;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
    apiKey,
  )}&pageSize=100`;
  const res = await fetch(url);
  if (!res.ok) {
    modelListCache.set(ck, { ids: [], fetchedAt: Date.now() });
    return [];
  }

  const data = (await res.json()) as { models?: ListedModel[] };
  const ids: string[] = [];

  for (const m of data.models ?? []) {
    const methods = m.supportedGenerationMethods ?? [];
    const supportsText =
      forStream &&
      (methods.includes("streamGenerateContent") ||
        methods.includes("generateContent"));
    const supportsGen = !forStream && methods.includes("generateContent");
    if (!supportsText && !supportsGen) continue;

    const name = m.name ?? "";
    if (!name.startsWith("models/")) continue;
    const short = name.slice("models/".length);
    const lower = short.toLowerCase();
    if (lower.includes("embedding")) continue;
    if (!lower.includes("gemini")) continue;
    ids.push(short);
  }

  ids.sort((a, b) => {
    const flashA = a.includes("flash") ? 0 : 1;
    const flashB = b.includes("flash") ? 0 : 1;
    if (flashA !== flashB) return flashA - flashB;
    const proA = a.includes("pro") ? 0 : 1;
    const proB = b.includes("pro") ? 0 : 1;
    if (proA !== proB) return proA - proB;
    return a.localeCompare(b);
  });

  modelListCache.set(ck, { ids, fetchedAt: Date.now() });
  return ids;
}

async function mergedModelOrder(
  apiKey: string,
  method: "generateContent" | "streamGenerateContent",
): Promise<string[]> {
  const staticOrder = configuredModels();
  const discovered = await discoverModelIds(
    apiKey,
    method === "streamGenerateContent",
  );
  const out: string[] = [];
  for (const m of [...staticOrder, ...discovered]) {
    if (!out.includes(m)) out.push(m);
  }
  return out;
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
  const models = await mergedModelOrder(apiKey, method);
  const rateLimited: string[] = [];
  const notFound: string[] = [];

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

    if (res.status === 429) {
      rateLimited.push(model);
      if (i < models.length - 1) {
        await sleep(900);
      }
      continue;
    }

    if (res.status === 404) {
      notFound.push(model);
      continue;
    }

    throw new Error(`Gemini error ${res.status}: ${lastDetail}`);
  }

  if (rateLimited.length === models.length && models.length > 0) {
    throw new Error(
      `Gemini rate limited on all tried models (${rateLimited.join(", ")}). Wait 1–2 minutes and run again, or enable billing / raise quotas in Google AI Studio.`,
    );
  }

  if (notFound.length === models.length && models.length > 0) {
    throw new Error(
      `No Gemini text model available for this API key (all returned 404). Tried: ${notFound.slice(0, 12).join(", ")}${notFound.length > 12 ? "…" : ""}. In Google AI Studio, list models for your key or set GEMINI_MODEL to an ID from ListModels.`,
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
