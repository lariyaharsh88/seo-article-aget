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

export function serverKeyStatus(): {
  gemini: boolean;
  tavily: boolean;
  serper: boolean;
} {
  return {
    gemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
    tavily: Boolean(process.env.TAVILY_API_KEY?.trim()),
    serper: Boolean(process.env.SERPER_API_KEY?.trim()),
  };
}
