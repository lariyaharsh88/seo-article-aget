import { NextResponse } from "next/server";

type Cluster = {
  name: string;
  keywords: string[];
};

type Body = {
  keywords?: string[];
};

function normalizeKeywordList(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const t = raw.trim().replace(/\s+/g, " ");
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function charTrigrams(s: string): string[] {
  const t = s.toLowerCase().replace(/\s+/g, " ").trim();
  if (t.length < 3) return [t];
  const out: string[] = [];
  for (let i = 0; i <= t.length - 3; i++) {
    out.push(t.slice(i, i + 3));
  }
  return out;
}

function bag(items: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of items) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let aa = 0;
  let bb = 0;
  a.forEach((v) => {
    aa += v * v;
  });
  b.forEach((v) => {
    bb += v * v;
  });
  a.forEach((v, k) => {
    const bv = b.get(k);
    if (bv) dot += v * bv;
  });
  if (aa === 0 || bb === 0) return 0;
  return dot / Math.sqrt(aa * bb);
}

function vectorizeKeyword(keyword: string): Map<string, number> {
  const wordTokens = tokenize(keyword).map((w) => `w:${w}`);
  const triTokens = charTrigrams(keyword).map((g) => `g:${g}`);
  return bag([...wordTokens, ...triTokens]);
}

function bestClusterIndex(
  keywordVec: Map<string, number>,
  clusters: Array<{ vectors: Map<string, number>[] }>,
): { index: number; score: number } {
  let bestIdx = -1;
  let bestScore = -1;
  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i];
    let score = 0;
    for (const v of c.vectors) {
      score = Math.max(score, cosine(keywordVec, v));
    }
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return { index: bestIdx, score: bestScore };
}

function clusterKeywords(keywords: string[]): Cluster[] {
  const threshold = 0.42;
  const clusters: Array<{ name: string; keywords: string[]; vectors: Map<string, number>[] }> = [];

  for (const kw of keywords) {
    const vec = vectorizeKeyword(kw);
    if (clusters.length === 0) {
      clusters.push({ name: kw, keywords: [kw], vectors: [vec] });
      continue;
    }
    const { index, score } = bestClusterIndex(vec, clusters);
    if (index >= 0 && score >= threshold) {
      clusters[index].keywords.push(kw);
      clusters[index].vectors.push(vec);
    } else {
      clusters.push({ name: kw, keywords: [kw], vectors: [vec] });
    }
  }

  clusters.sort((a, b) => b.keywords.length - a.keywords.length);
  return clusters.map((c, i) => ({
    name: `Cluster ${i + 1}: ${c.name}`,
    keywords: c.keywords,
  }));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const keywords = normalizeKeywordList(body.keywords);
    if (keywords.length < 2) {
      return NextResponse.json(
        { error: "Provide at least 2 keywords.", clusters: [] },
        { status: 400 },
      );
    }
    const capped = keywords.slice(0, 250);
    const clusters = clusterKeywords(capped);
    return NextResponse.json({
      clusters,
      totalKeywords: capped.length,
      totalClusters: clusters.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Clustering failed";
    return NextResponse.json({ error: message, clusters: [] }, { status: 500 });
  }
}
