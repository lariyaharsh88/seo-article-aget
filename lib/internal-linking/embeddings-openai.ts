import { buildArticleTextForEmbedding } from "@/lib/internal-linking/fallback-embedding";
import type { ArticleInput } from "@/lib/internal-linking/types";

const OPENAI_EMBEDDINGS = "https://api.openai.com/v1/embeddings";

export async function fetchOpenAIEmbeddings(
  articles: ArticleInput[],
  apiKey: string,
  model: string,
): Promise<{ vectors: number[][]; dimensions: number; model: string }> {
  const inputs = articles.map((a) => buildArticleTextForEmbedding(a));
  const res = await fetch(OPENAI_EMBEDDINGS, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: inputs,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embeddings failed (${res.status}): ${err.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    data: { embedding: number[]; index: number }[];
    model: string;
  };
  const sorted = [...data.data].sort((a, b) => a.index - b.index);
  const vectors = sorted.map((d) => d.embedding);
  const dimensions = vectors[0]?.length ?? 0;
  return { vectors, dimensions, model: data.model ?? model };
}
