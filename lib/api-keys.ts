export function resolveGeminiKey(request: Request): string | undefined {
  const header = request.headers.get("x-gemini-key")?.trim();
  if (header) return header;
  return process.env.GEMINI_API_KEY?.trim() || undefined;
}

export function resolveTavilyKey(request: Request): string | undefined {
  const header = request.headers.get("x-tavily-key")?.trim();
  if (header) return header;
  return process.env.TAVILY_API_KEY?.trim() || undefined;
}

export function resolveSerperKey(request: Request): string | undefined {
  const header = request.headers.get("x-serper-key")?.trim();
  if (header) return header;
  return process.env.SERPER_API_KEY?.trim() || undefined;
}

/** OpenAI — optional if you add tools that call OpenAI APIs. */
export function resolveOpenAIKey(request: Request): string | undefined {
  const header = request.headers.get("x-openai-key")?.trim();
  if (header) return header;
  return process.env.OPENAI_API_KEY?.trim() || undefined;
}

export function resolveGroqKey(request: Request): string | undefined {
  const header = request.headers.get("x-groq-key")?.trim();
  if (header) return header;
  return process.env.GROQ_API_KEY?.trim() || undefined;
}

export function serverKeyStatus(): {
  gemini: boolean;
  groq: boolean;
  tavily: boolean;
  serper: boolean;
  searchConsole: boolean;
} {
  const gscSite = Boolean(process.env.GSC_SITE_URL?.trim());
  const gscSa = Boolean(process.env.GSC_SERVICE_ACCOUNT_JSON?.trim());
  const gscOAuth =
    Boolean(process.env.GSC_CLIENT_ID?.trim()) &&
    Boolean(process.env.GSC_CLIENT_SECRET?.trim()) &&
    Boolean(process.env.GSC_REFRESH_TOKEN?.trim());
  const gsc = gscSite && (gscSa || gscOAuth);

  return {
    gemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
    groq: Boolean(process.env.GROQ_API_KEY?.trim()),
    tavily: Boolean(process.env.TAVILY_API_KEY?.trim()),
    serper: Boolean(process.env.SERPER_API_KEY?.trim()),
    searchConsole: gsc,
  };
}
