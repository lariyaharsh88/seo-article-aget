import { fetchOpenAIEmbeddings } from "@/lib/internal-linking/embeddings-openai";
import {
  buildArticleTextForEmbedding,
  hashEmbedding,
} from "@/lib/internal-linking/fallback-embedding";
import { clusterLabels, UnionFind } from "@/lib/internal-linking/cluster";
import { normalizePhrase, primaryFromKeywords, tokenize } from "@/lib/internal-linking/normalize";
import { cosineSimilarity } from "@/lib/internal-linking/similarity";
import type {
  ArticleInput,
  InternalLinkEdge,
  InternalLinkKind,
  SuggestOptions,
  SuggestResult,
} from "@/lib/internal-linking/types";

function jaccardKeywordSets(a: ArticleInput, b: ArticleInput): number {
  const sa = new Set(a.keywords.map((k) => normalizePhrase(k.phrase)).filter(Boolean));
  const sb = new Set(b.keywords.map((k) => normalizePhrase(k.phrase)).filter(Boolean));
  if (sa.size === 0 && sb.size === 0) return 0;
  let inter = 0;
  sa.forEach((x) => {
    if (sb.has(x)) inter++;
  });
  return inter / (sa.size + sb.size - inter || 1);
}

function isParentChild(parent: ArticleInput, child: ArticleInput): boolean {
  const pPrimary = normalizePhrase(primaryFromKeywords(parent.keywords) ?? parent.topic);
  const cPrimary = normalizePhrase(primaryFromKeywords(child.keywords) ?? child.topic);
  if (!cPrimary || pPrimary === cPrimary) return false;
  const hay = `${normalizePhrase(parent.title)} ${normalizePhrase(parent.topic)}`;
  if (hay.includes(cPrimary)) return true;
  const cTokens = new Set(tokenize(cPrimary));
  const pTokens = new Set(tokenize(hay));
  let overlap = 0;
  cTokens.forEach((t) => {
    if (pTokens.has(t)) overlap++;
  });
  return cTokens.size > 0 && overlap / cTokens.size >= 0.85;
}

function supportingKeywordHit(from: ArticleInput, to: ArticleInput, sim: number): boolean {
  if (jaccardKeywordSets(from, to) >= 0.12) return true;
  const toPhrases = to.keywords.filter((k) => k.role === "supporting" || k.role === "secondary");
  const body = `${from.markdown} ${from.title}`.toLowerCase();
  for (const k of toPhrases) {
    const p = normalizePhrase(k.phrase);
    if (p.length >= 4 && body.includes(p)) return true;
  }
  return sim >= 0.62;
}

function classifyKind(
  from: ArticleInput,
  to: ArticleInput,
  sameCluster: boolean,
  sim: number,
): InternalLinkKind {
  if (isParentChild(from, to)) return "parent_child";
  if (supportingKeywordHit(from, to, sim)) return "supporting_keyword";
  if (sameCluster) return "same_cluster";
  return "semantic";
}

function scoreEdge(
  kind: InternalLinkKind,
  sim: number,
  jaccard: number,
  sameCluster: boolean,
): number {
  const w =
    kind === "parent_child"
      ? 0.38
      : kind === "supporting_keyword"
        ? 0.32
        : kind === "same_cluster"
          ? 0.22
          : 0.12;
  const clusterBonus = sameCluster ? 0.12 : 0;
  return Math.min(
    1,
    0.52 * sim + 0.28 * jaccard + clusterBonus + w * 0.35,
  );
}

function pickAnchorText(from: ArticleInput, to: ArticleInput): string {
  const md = from.markdown;
  const lower = md.toLowerCase();
  const candidates = [
    primaryFromKeywords(to.keywords),
    ...to.keywords.map((k) => k.phrase),
    to.title,
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    const n = normalizePhrase(c);
    if (n.length < 3) continue;
    if (lower.includes(n)) return c.trim();
  }
  return (primaryFromKeywords(to.keywords) ?? to.title).slice(0, 72).trim();
}

function defaultHref(to: ArticleInput): string {
  if (to.url?.trim()) return to.url.trim();
  return `#article-${to.id}`;
}

/**
 * Suggested internal links between articles using embedding similarity + keyword / hierarchy heuristics.
 */
export async function suggestInternalLinks(
  articles: ArticleInput[],
  opts: SuggestOptions & { openaiApiKey?: string },
): Promise<SuggestResult> {
  const maxOut = opts.maxOutgoingPerArticle ?? 8;
  const maxIn = opts.maxIncomingPerArticle ?? 12;
  const clusterTh = opts.clusterSimilarityThreshold ?? 0.78;
  const semMin = opts.semanticMinSim ?? 0.52;
  const embModel = opts.embeddingModel ?? "text-embedding-3-small";

  if (articles.length < 2) {
    return { edges: [], clusters: {}, embeddingModel: embModel, usedOpenAI: false };
  }

  const n = articles.length;
  let vectors: number[][] = [];
  let usedOpenAI = false;

  if (opts.openaiApiKey?.trim()) {
    const r = await fetchOpenAIEmbeddings(articles, opts.openaiApiKey.trim(), embModel);
    vectors = r.vectors;
    usedOpenAI = true;
  } else {
    vectors = articles.map((a) =>
      hashEmbedding(buildArticleTextForEmbedding(a), 256),
    );
  }

  const simMat: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s = cosineSimilarity(vectors[i], vectors[j]);
      simMat[i][j] = s;
      simMat[j][i] = s;
    }
    simMat[i][i] = 1;
  }

  const uf = new UnionFind(n);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s = simMat[i][j];
      const jacc = jaccardKeywordSets(articles[i], articles[j]);
      if (s >= clusterTh || jacc >= 0.2) uf.union(i, j);
    }
  }

  const labels = clusterLabels(uf, n);
  const clusters: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    clusters[articles[i].id] = labels[i];
  }

  const candidates: InternalLinkEdge[] = [];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const sim = simMat[i][j];
      const jacc = jaccardKeywordSets(articles[i], articles[j]);
      const sameCluster = labels[i] === labels[j];
      if (sim < semMin && jacc < 0.08 && !isParentChild(articles[i], articles[j])) continue;

      const kind = classifyKind(articles[i], articles[j], sameCluster, sim);
      const sc = scoreEdge(kind, sim, jacc, sameCluster);
      if (sc < 0.28) continue;

      const anchorText = pickAnchorText(articles[i], articles[j]);
      const rationale = [
        `cos=${sim.toFixed(3)}`,
        `jacc=${jacc.toFixed(3)}`,
        `cluster=${sameCluster}`,
        kind,
      ].join("|");

      candidates.push({
        fromId: articles[i].id,
        toId: articles[j].id,
        score: sc,
        kind,
        anchorText,
        href: defaultHref(articles[j]),
        rationale,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const outCount = new Map<string, number>();
  const inCount = new Map<string, number>();
  const edges: InternalLinkEdge[] = [];
  /** At most one edge per unordered pair (keeps graph sparse / avoids reciprocal spam). */
  const pairUndirected = new Set<string>();

  for (const c of candidates) {
    const undirectedKey = [c.fromId, c.toId].sort().join("|");
    if (pairUndirected.has(undirectedKey)) continue;
    const o = outCount.get(c.fromId) ?? 0;
    const inn = inCount.get(c.toId) ?? 0;
    if (o >= maxOut || inn >= maxIn) continue;
    pairUndirected.add(undirectedKey);
    outCount.set(c.fromId, o + 1);
    inCount.set(c.toId, inn + 1);
    edges.push({
      fromId: c.fromId,
      toId: c.toId,
      score: c.score,
      kind: c.kind,
      anchorText: c.anchorText,
      href: c.href,
      rationale: c.rationale,
    });
  }

  return { edges, clusters, embeddingModel: embModel, usedOpenAI };
}
