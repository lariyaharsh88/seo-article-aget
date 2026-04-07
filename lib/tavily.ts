export interface TavilyResultItem {
  url: string;
  title: string;
  content: string;
  score?: number;
}

export interface TavilyResponse {
  results: TavilyResultItem[];
  answer: string;
  query?: string;
}

export async function tavilySearch(
  query: string,
  apiKey: string,
  depth: "basic" | "advanced" = "advanced",
): Promise<TavilyResponse> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: depth,
      max_results: 8,
      include_answer: true,
      include_raw_content: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) {
      throw new Error(
        "Tavily rate limit reached. Retry shortly or check your quota.",
      );
    }
    throw new Error(`Tavily error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as TavilyResponse;
  return {
    results: data.results ?? [],
    answer: data.answer ?? "",
    query: data.query,
  };
}
