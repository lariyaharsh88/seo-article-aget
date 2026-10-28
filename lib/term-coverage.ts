// Client-safe term coverage helpers (no Node-only imports).

export interface CompetitorPageText {
  url: string;
  text: string;
  wordCount: number;
  headings?: string[];
}

export interface CoverageTerm {
  term: string;
  pages: number;
  minCount: number;
  maxCount: number;
  avgCount: number;
  recommended: [number, number];
  weight: number;
}

export interface TermExtractionResult {
  terms: CoverageTerm[];
  avgWordCount: number;
  medianWordCount: number;
  headingsSample: string[];
}

export type TermStatus = "missing" | "under" | "ok" | "over";

export interface TermCoverageItem extends CoverageTerm {
  count: number;
  status: TermStatus;
}

export interface CoverageScore {
  score: number;
  items: TermCoverageItem[];
  wordCount: number;
  wordCountStatus: "short" | "ok" | "long" | "unknown";
  counts: Record<TermStatus, number>;
}

const STOPWORDS = new Set(
  (
    "a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just let me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves us may might must shall one get got also like use used using via per etc inc ltd www com http https html amp nbsp new click read more share view cookie cookies privacy policy terms sign login log subscribe menu home skip content"
  ).split(/\s+/),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]+/g, " ")
    .replace(/-+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function isGoodToken(t: string): boolean {
  return t.length >= 3 && !/^\d+$/.test(t);
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

function ngramsOf(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (k: string) => counts.set(k, (counts.get(k) ?? 0) + 1);
  for (let i = 0; i < tokens.length; i++) {
    const a = tokens[i];
    if (!STOPWORDS.has(a) && isGoodToken(a)) add(a);
    for (const n of [2, 3]) {
      if (i + n > tokens.length) break;
      const g = tokens.slice(i, i + n);
      // must start and end with content words; no numbers-only tokens
      if (STOPWORDS.has(g[0]) || STOPWORDS.has(g[n - 1])) continue;
      if (g.some((t) => /^\d+$/.test(t) || t.length < 2)) continue;
      if (g.filter((t) => !STOPWORDS.has(t) && isGoodToken(t)).length < (n === 2 ? 2 : 2)) continue;
      add(g.join(" "));
    }
  }
  return counts;
}

export function extractTermsFromPages(
  pages: CompetitorPageText[],
  keyword: string,
  opts: { maxTerms?: number; targetWordCount?: number } = {},
): TermExtractionResult {
  const valid = pages.filter((p) => p.text && p.wordCount > 50);
  const wcs = valid.map((p) => p.wordCount);
  const avgWordCount = wcs.length ? Math.round(wcs.reduce((a, b) => a + b, 0) / wcs.length) : 0;
  const medianWordCount = median(wcs);
  const headingsSample = Array.from(
    new Set(valid.flatMap((p) => (p.headings ?? []).map((h) => h.trim())).filter(Boolean)),
  ).slice(0, 40);

  const N = valid.length;
  if (N === 0) return { terms: [], avgWordCount, medianWordCount, headingsSample };

  const perPage = valid.map((p) => ngramsOf(tokenize(p.text)));
  const df = new Map<string, number[]>();
  perPage.forEach((m) => {
    m.forEach((c, k) => {
      const arr = df.get(k);
      if (arr) arr.push(c);
      else df.set(k, [c]);
    });
  });

  const minPages = Math.max(2, Math.ceil(N * 0.4));
  const target = opts.targetWordCount ?? (medianWordCount || avgWordCount);
  const scale = avgWordCount > 0 && target > 0 ? target / avgWordCount : 1;
  const kwTokens = new Set(tokenize(keyword));

  type Cand = CoverageTerm & { score: number };
  const cands: Cand[] = [];
  df.forEach((counts, term) => {
    if (counts.length < minPages) return;
    const n = term.split(" ").length;
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const idf = Math.log(1 + (N + 1) / counts.length);
    const kwBoost = term.split(" ").some((t) => kwTokens.has(t)) ? 1.3 : 1;
    const score = (counts.length / N) * idf * Math.log(1 + avg) * (1 + 0.35 * (n - 1)) * kwBoost;
    const sorted = [...counts].sort((a, b) => a - b);
    const lo = sorted[Math.floor(sorted.length * 0.25)];
    const hi = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75))];
    const low = Math.max(1, Math.round(lo * scale));
    const high = Math.max(low, Math.round(Math.max(hi, avg) * scale));
    cands.push({
      term,
      pages: counts.length,
      minCount: sorted[0],
      maxCount: sorted[sorted.length - 1],
      avgCount: Math.round(avg * 10) / 10,
      recommended: [low, high],
      weight: 0,
      score,
    });
  });

  cands.sort((a, b) => b.score - a.score);
  // drop unigrams/bigrams fully subsumed by a higher-ranked longer phrase with near-equal counts
  const kept: Cand[] = [];
  for (const c of cands) {
    const dup = kept.some(
      (k) =>
        k.term.includes(c.term) &&
        k.term !== c.term &&
        k.pages >= c.pages &&
        k.avgCount >= c.avgCount * 0.85,
    );
    if (!dup) kept.push(c);
    if (kept.length >= (opts.maxTerms ?? 60)) break;
  }
  const maxScore = kept[0]?.score || 1;
  const terms = kept.map(({ score, ...t }) => ({
    ...t,
    weight: Math.round((0.3 + 0.7 * (score / maxScore)) * 100) / 100,
  }));
  return { terms, avgWordCount, medianWordCount, headingsSample };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const regexCache = new WeakMap<CoverageTerm[], RegExp[]>();

function compiled(terms: CoverageTerm[]): RegExp[] {
  let res = regexCache.get(terms);
  if (!res) {
    res = terms.map(
      (t) =>
        new RegExp(
          `(?<![a-z0-9])${t.term.split(" ").map(escapeRe).join("[\\s\\-]+")}(?![a-z0-9])`,
          "g",
        ),
    );
    regexCache.set(terms, res);
  }
  return res;
}

function normalizeDraft(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .toLowerCase()
    .replace(/[’']/g, "");
}

export function scoreCoverage(
  markdown: string,
  terms: CoverageTerm[],
  medianWordCount = 0,
): CoverageScore {
  const text = normalizeDraft(markdown || "");
  const wordCount = (text.match(/[a-z0-9]+/g) ?? []).length;
  const regs = compiled(terms);
  const counts: Record<TermStatus, number> = { missing: 0, under: 0, ok: 0, over: 0 };
  let got = 0;
  let total = 0;
  const items = terms.map((t, i) => {
    const re = regs[i];
    re.lastIndex = 0;
    const count = (text.match(re) ?? []).length;
    const [low, high] = t.recommended;
    let status: TermStatus;
    let credit: number;
    if (count === 0) {
      status = "missing";
      credit = 0;
    } else if (count < low) {
      status = "under";
      credit = 0.5 + 0.5 * (count / low);
    } else if (count > high) {
      status = "over";
      credit = Math.max(0.6, 1 - 0.1 * ((count - high) / Math.max(1, high)));
    } else {
      status = "ok";
      credit = 1;
    }
    counts[status]++;
    got += credit * t.weight;
    total += t.weight;
    return { ...t, count, status };
  });
  let wordCountStatus: CoverageScore["wordCountStatus"] = "unknown";
  if (medianWordCount > 0) {
    const r = wordCount / medianWordCount;
    wordCountStatus = r < 0.8 ? "short" : r > 1.5 ? "long" : "ok";
  }
  const score = total > 0 ? Math.round((got / total) * 100) : 0;
  return { score, items, wordCount, wordCountStatus, counts };
}
