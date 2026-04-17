import { cosineSimilarity } from "@/lib/internal-linking/similarity";

/**
 * Lightweight deterministic "embedding" when OpenAI is unavailable (CI, local dev).
 * Uses hashed bag-of-words — not semantic quality, but stable similarity for clustering.
 */
export function hashEmbedding(text: string, dimensions = 256): number[] {
  const v = new Array(dimensions).fill(0);
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  for (const t of tokens) {
    let h = 0;
    for (let i = 0; i < t.length; i++) {
      h = (Math.imul(31, h) + t.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(h) % dimensions;
    v[idx] += 1;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  if (norm === 0) return v;
  return v.map((x) => x / norm);
}

export function buildArticleTextForEmbedding(a: {
  title: string;
  topic: string;
  keywords: { phrase: string }[];
}): string {
  const kw = a.keywords.map((k) => k.phrase).join(" ");
  return `${a.title}\n${a.topic}\n${kw}`;
}

export function pairwiseLexicalSimilarity(
  texts: string[],
  dimensions = 256,
): number[][] {
  const n = texts.length;
  const vecs = texts.map((t) => hashEmbedding(t, dimensions));
  const sim: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const c = cosineSimilarity(vecs[i], vecs[j]);
      sim[i][j] = c;
      sim[j][i] = c;
    }
    sim[i][i] = 1;
  }
  return sim;
}
