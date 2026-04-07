import googleTrends from "google-trends-api";

export type ReportGroup = "exams" | "colleges" | "courses" | "education";

export type EducationTrendSource =
  | "related_queries_top"
  | "related_queries_rising"
  | "related_topics_top"
  | "related_topics_rising"
  | "daily_trends"
  | "realtime_trends";

export interface EducationTrendRow {
  id: string;
  title: string;
  source: EducationTrendSource;
  seed?: string;
  reportGroup: ReportGroup;
  /** Relative score, traffic label, or "Breakout" from Google. */
  metric: string;
  geo: string;
  exploreUrl: string;
}

/** Daily / realtime stories must match this OR group-specific inference below. */
const EDUCATION_TEXT =
  /\b(education|educational|edtech|e-learning|elearning|school|schools|campus|universit(y|ies)|college|student(s)?|teacher(s)?|classroom|academic|curriculum|homework|exam(s)?|test prep|quiz|NCERT|CBSE|ICSE|ISC|state board|board exam|SAT|ACT|GRE|GMAT|LSAT|MCAT|IELTS|TOEFL|JEE|NEET|CUET|UPSC|SSC|GATE|CAT|CLAT|BITSAT|NTA|KVPY|NTSE|Olympiad|scholarship|tuition|admission(s)?|enrol(l)?ment|degree|MBA|PhD|doctorate|STEM|MOOC|online course|certification|bootcamp|distance learning|kindergarten|K-12|high school|middle school|homeschool|FAFSA|student loan|learn(ing)?|lecture|pedagogy|syllabus|semester|credit hour|sarkari|result(s)?|admit card|hall ticket|application form|exam date|time table|date sheet|revaluation|recheck(ing)?|counsell?ing|cut ?off|merit list|rank list|answer key|provisional|allotment|seat matrix|\bPUC\b|SSLC|HSC|HSLC|MBoSE|CISCE|NIRF|DigiLocker|pariksha)\b/i;

/**
 * Seeds grouped like a Trends “report”: exams, colleges & admissions, courses, broad education.
 * relatedQueries pulls Top + Rising for each (last 90 days, regional).
 */
const SEED_DEFINITIONS: Array<{ seed: string; group: ReportGroup }> = [
  { seed: "SAT exam", group: "exams" },
  { seed: "ACT test", group: "exams" },
  { seed: "GRE test", group: "exams" },
  { seed: "GMAT exam", group: "exams" },
  { seed: "MCAT study", group: "exams" },
  { seed: "IELTS preparation", group: "exams" },
  { seed: "TOEFL test", group: "exams" },
  { seed: "entrance exam", group: "exams" },
  { seed: "competitive exam", group: "exams" },
  { seed: "college admissions", group: "colleges" },
  { seed: "university ranking", group: "colleges" },
  { seed: "ivy league", group: "colleges" },
  { seed: "campus placement", group: "colleges" },
  { seed: "scholarship", group: "colleges" },
  { seed: "student housing", group: "colleges" },
  { seed: "financial aid college", group: "colleges" },
  { seed: "transfer student", group: "colleges" },
  { seed: "online courses", group: "courses" },
  { seed: "MOOC", group: "courses" },
  { seed: "professional certificate", group: "courses" },
  { seed: "data science bootcamp", group: "courses" },
  { seed: "MBA program", group: "courses" },
  { seed: "undergraduate degree", group: "courses" },
  { seed: "accredited online degree", group: "courses" },
  { seed: "continuing education", group: "courses" },
  { seed: "vocational training", group: "courses" },
  { seed: "education", group: "education" },
  { seed: "K-12 education", group: "education" },
  { seed: "homeschool", group: "education" },
  { seed: "EdTech", group: "education" },
  { seed: "teacher training", group: "education" },
  { seed: "special education", group: "education" },
  { seed: "early childhood education", group: "education" },
];

/**
 * Indian education ecosystem: results, dates, forms, hall tickets, and major exams.
 * Used when geo is IN (and blended into explore aggregation).
 */
const INDIA_EDUCATION_SEEDS: Array<{ seed: string; group: ReportGroup }> = [
  { seed: "JEE Main", group: "exams" },
  { seed: "JEE Advanced", group: "exams" },
  { seed: "NEET", group: "exams" },
  { seed: "CUET", group: "exams" },
  { seed: "UPSC", group: "exams" },
  { seed: "SSC exam", group: "exams" },
  { seed: "GATE exam", group: "exams" },
  { seed: "CAT exam", group: "exams" },
  { seed: "CLAT exam", group: "exams" },
  { seed: "board exam result", group: "exams" },
  { seed: "CBSE result", group: "exams" },
  { seed: "ICSE result", group: "exams" },
  { seed: "10th result", group: "exams" },
  { seed: "12th result", group: "exams" },
  { seed: "competitive exam", group: "exams" },
  { seed: "entrance exam", group: "exams" },
  { seed: "admit card", group: "exams" },
  { seed: "hall ticket", group: "exams" },
  { seed: "exam date", group: "exams" },
  { seed: "exam time table", group: "exams" },
  { seed: "application form", group: "colleges" },
  { seed: "online application college", group: "colleges" },
  { seed: "college admission", group: "colleges" },
  { seed: "university admission India", group: "colleges" },
  { seed: "scholarship India", group: "colleges" },
  { seed: "cut off marks", group: "colleges" },
  { seed: "sarkari result", group: "education" },
  { seed: "NCERT syllabus", group: "courses" },
  { seed: "online coaching", group: "courses" },
  { seed: "skill course", group: "courses" },
  { seed: "education news India", group: "education" },
];

/** Anchor topics for relatedTopics (same four chapters as the report). */
const TOPIC_ANCHORS: Array<{ keyword: string; group: ReportGroup }> = [
  { keyword: "standardized test", group: "exams" },
  { keyword: "university admissions", group: "colleges" },
  { keyword: "online learning courses", group: "courses" },
  { keyword: "public education", group: "education" },
];

const TOPIC_ANCHORS_IN: Array<{ keyword: string; group: ReportGroup }> = [
  { keyword: "engineering entrance exam", group: "exams" },
  { keyword: "medical entrance exam India", group: "exams" },
  { keyword: "university admissions India", group: "colleges" },
  { keyword: "online courses India", group: "courses" },
];

/** Benchmark terms for a multi-series interest-over-time strip (Google-style 0–100 index). */
const INTEREST_BENCHMARKS = [
  "SAT",
  "college admissions",
  "online courses",
  "education",
] as const;

const INTEREST_BENCHMARKS_IN = [
  "JEE Main",
  "NEET",
  "CBSE result",
  "education",
] as const;

export type EducationTimeframe = "past_24_hours" | "past_7_days" | "past_90_days";

export function parseEducationTimeframe(
  raw: string | null | undefined,
): EducationTimeframe {
  if (
    raw === "past_24_hours" ||
    raw === "past_7_days" ||
    raw === "past_90_days"
  ) {
    return raw;
  }
  return "past_7_days";
}

export interface ExploreQueryRow {
  rank: number;
  query: string;
  /** 0–100 bar width (relative within this list). */
  interest: number;
  changeLabel: string;
  changeDirection: "up" | "down" | "breakout" | "flat";
  exploreUrl: string;
}

export interface EducationExploreSnapshot {
  timeframe: EducationTimeframe;
  timeframeLabel: string;
  top: ExploreQueryRow[];
  rising: ExploreQueryRow[];
}

function timeframeToWindow(tf: EducationTimeframe): {
  start: Date;
  end: Date;
} {
  const end = new Date();
  switch (tf) {
    case "past_24_hours":
      return {
        start: new Date(end.getTime() - 24 * 60 * 60 * 1000),
        end,
      };
    case "past_7_days":
      return {
        start: new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000),
        end,
      };
    case "past_90_days":
    default:
      return {
        start: new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000),
        end,
      };
  }
}

function timeframeLabel(tf: EducationTimeframe): string {
  switch (tf) {
    case "past_24_hours":
      return "Past 24 hours";
    case "past_7_days":
      return "Past 7 days";
    case "past_90_days":
    default:
      return "Past 90 days";
  }
}

function parseTopInterestScore(raw: string): number {
  const n = Number(String(raw).replace(/,/g, ""));
  if (Number.isFinite(n) && n >= 0) return Math.min(100, n);
  return 0;
}

function parseRisingDisplay(raw: string): {
  label: string;
  direction: ExploreQueryRow["changeDirection"];
  strength: number;
} {
  const v = String(raw).trim();
  if (/^breakout$/i.test(v) || /^Breakout$/i.test(v) || /breakout/i.test(v)) {
    return { label: "BREAKOUT", direction: "breakout", strength: 1_000_000 };
  }
  const pct = v.match(/([+\-]?[\d][\d,]*)\s*%/);
  if (pct) {
    const n = Number(pct[1].replace(/,/g, ""));
    if (Number.isFinite(n)) {
      const label = `${n > 0 ? "+" : ""}${n.toLocaleString("en-IN")}%`;
      return {
        label,
        direction: n > 0 ? "up" : n < 0 ? "down" : "flat",
        strength: Math.abs(n),
      };
    }
  }
  const plain = Number(String(raw).replace(/,/g, ""));
  if (Number.isFinite(plain) && plain > 0) {
    return {
      label: `+${plain.toLocaleString("en-IN")}%`,
      direction: "up",
      strength: plain,
    };
  }
  if (v && v !== "—") {
    return { label: v, direction: "flat", strength: 0 };
  }
  return { label: "—", direction: "flat", strength: 0 };
}

function buildExploreRows(params: {
  topMap: Map<string, { query: string; score: number }>;
  risingMap: Map<
    string,
    { query: string; label: string; direction: ExploreQueryRow["changeDirection"]; strength: number }
  >;
  geo: string;
  limit?: number;
}): { top: ExploreQueryRow[]; rising: ExploreQueryRow[] } {
  const limit = params.limit ?? 25;
  const topSorted = Array.from(params.topMap.values()).sort(
    (a, b) => b.score - a.score,
  );
  const topSlice = topSorted.slice(0, limit);
  const maxTop = topSlice.reduce((m, x) => Math.max(m, x.score), 0) || 1;

  const top: ExploreQueryRow[] = topSlice.map((row, i) => ({
    rank: i + 1,
    query: row.query,
    interest: Math.round((100 * row.score) / maxTop),
    /** Related-queries "top" lists give relative interest, not % change vs prior period. */
    changeLabel: "—",
    changeDirection: "flat" as const,
    exploreUrl: exploreUrl(row.query, params.geo),
  }));

  const risingSorted = Array.from(params.risingMap.values()).sort((a, b) => {
    if (a.direction === "breakout" && b.direction !== "breakout") return -1;
    if (b.direction === "breakout" && a.direction !== "breakout") return 1;
    return b.strength - a.strength;
  });
  const risingSlice = risingSorted.slice(0, limit);
  const maxRise = risingSlice.reduce((m, x) => Math.max(m, x.strength), 0) || 1;

  const rising: ExploreQueryRow[] = risingSlice.map((row, i) => ({
    rank: i + 1,
    query: row.query,
    interest:
      row.direction === "breakout"
        ? 100
        : Math.min(100, Math.round((100 * row.strength) / maxRise)),
    changeLabel: row.label,
    changeDirection: row.direction,
    exploreUrl: exploreUrl(row.query, params.geo),
  }));

  return { top, rising };
}

export interface InterestTimelinePoint {
  /** e.g. "Apr 3" */
  label: string;
  /** One value per benchmark keyword, 0–100 relative to peak in window */
  values: number[];
}

export interface InterestComparison {
  keywords: readonly string[];
  timeline: InterestTimelinePoint[];
  /** Plain-language note from Google Trends methodology */
  note: string;
}

const mergeMap = new Map<string, EducationTrendRow>();

function exploreUrl(query: string, geo: string): string {
  const q = encodeURIComponent(query);
  const g = encodeURIComponent(geo);
  return `https://trends.google.com/trends/explore?q=${q}&geo=${g}`;
}

function slugId(parts: string[]): string {
  return parts.join("|").toLowerCase().replace(/\s+/g, " ").slice(0, 200);
}

function parseJsonSafe(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function inferReportGroupFromTitle(title: string): ReportGroup {
  const t = title;
  if (
    /\b(exam|exams|SAT|ACT|GRE|GMAT|MCAT|LSAT|IELTS|TOEFL|JEE|NEET|UPSC|GATE|test prep|entrance|board exam|quiz|proctor|score)\b/i.test(
      t,
    )
  ) {
    return "exams";
  }
  if (
    /\b(college|university|campus|admission|ivy|scholarship|tuition|dorm|deferral|ranking|financial aid|Greek life)\b/i.test(
      t,
    )
  ) {
    return "colleges";
  }
  if (
    /\b(course|courses|MOOC|certification|bootcamp|syllabus|module|curriculum|workshop|credential|diploma|credit hour)\b/i.test(
      t,
    )
  ) {
    return "courses";
  }
  return "education";
}

function labelFromRankedEntry(k: Record<string, unknown>): string {
  if (typeof k.query === "string" && k.query.trim()) return k.query.trim();
  const topic = k.topic;
  if (isRecord(topic) && typeof topic.title === "string" && topic.title.trim()) {
    return topic.title.trim();
  }
  return "";
}

function extractRankedKeywords(
  parsed: unknown,
  which: "top" | "rising",
): Array<{ query: string; value: string }> {
  const root = parsed;
  if (!isRecord(root) || !isRecord(root.default)) return [];
  const def = root.default as Record<string, unknown>;
  const rankedList = def.rankedList;
  if (!Array.isArray(rankedList)) return [];
  const idx = which === "top" ? 0 : 1;
  const bucket = rankedList[idx];
  if (!isRecord(bucket)) return [];
  const keywords = bucket.rankedKeyword;
  if (!Array.isArray(keywords)) return [];
  const out: Array<{ query: string; value: string }> = [];
  for (const k of keywords) {
    if (!isRecord(k)) continue;
    const q = labelFromRankedEntry(k);
    if (!q) continue;
    let value = "";
    const v = k.value;
    if (typeof v === "number" || typeof v === "string") {
      value = String(v);
    }
    const extracted = k.extractedValue;
    if (typeof extracted === "number" || typeof extracted === "string") {
      value = value || String(extracted);
    }
    out.push({ query: q, value: value || "—" });
  }
  return out;
}

function extractRelatedTopics(
  parsed: unknown,
  which: "top" | "rising",
): Array<{ topic: string; value: string }> {
  const rows = extractRankedKeywords(parsed, which);
  return rows.map((r) => ({ topic: r.query, value: r.value }));
}

function parseDailyEducation(parsed: unknown, geo: string): EducationTrendRow[] {
  const out: EducationTrendRow[] = [];
  if (!isRecord(parsed) || !isRecord(parsed.default)) return out;
  const def = parsed.default as Record<string, unknown>;
  const days = def.trendingSearchesDays;
  if (!Array.isArray(days)) return out;
  for (const day of days) {
    if (!isRecord(day)) continue;
    const searches = day.trendingSearches;
    if (!Array.isArray(searches)) continue;
    for (const s of searches) {
      if (!isRecord(s)) continue;
      const title = s.title;
      const query =
        isRecord(title) && typeof title.query === "string"
          ? title.query
          : typeof s.query === "string"
            ? s.query
            : "";
      if (!query || !EDUCATION_TEXT.test(query)) continue;
      const traffic =
        typeof s.formattedTraffic === "string"
          ? s.formattedTraffic
          : "Trending (24h)";
      const reportGroup = inferReportGroupFromTitle(query);
      out.push({
        id: slugId(["daily", geo, query]),
        title: query,
        source: "daily_trends",
        reportGroup,
        metric: traffic,
        geo,
        exploreUrl: exploreUrl(query, geo),
      });
    }
  }
  return out;
}

function parseRealtimeEducation(parsed: unknown, geo: string): EducationTrendRow[] {
  const out: EducationTrendRow[] = [];
  let root: Record<string, unknown> | null = null;
  if (isRecord(parsed)) {
    if (isRecord(parsed.storySummaries)) root = parsed;
    else if (isRecord(parsed.default) && isRecord((parsed.default as Record<string, unknown>).storySummaries)) {
      root = parsed.default as Record<string, unknown>;
    }
  }
  if (!root || !isRecord(root.storySummaries)) return out;
  const ss = root.storySummaries as Record<string, unknown>;
  const stories = ss.trendingStories;
  if (!Array.isArray(stories)) return out;
  for (const st of stories) {
    if (!isRecord(st)) continue;
    let title = typeof st.title === "string" ? st.title : "";
    if (!title && Array.isArray(st.entityNames)) {
      const parts = st.entityNames.filter((x): x is string => typeof x === "string");
      title = parts.join(" · ");
    } else if (!title && typeof st.entityNames === "string") {
      title = st.entityNames;
    }
    if (!title || !EDUCATION_TEXT.test(title)) continue;
    const id =
      typeof st.id === "string" ? st.id : slugId(["rt", geo, title]);
    const reportGroup = inferReportGroupFromTitle(title);
    out.push({
      id: slugId(["realtime", geo, id]),
      title: title.trim(),
      source: "realtime_trends",
      reportGroup,
      metric: "Realtime (24h)",
      geo,
      exploreUrl: exploreUrl(title.split("–")[0]?.trim() || title, geo),
    });
  }
  return out;
}

function addRows(rows: EducationTrendRow[]): void {
  for (const r of rows) {
    const key = `${r.geo}::${r.title.toLowerCase()}`;
    if (!mergeMap.has(key)) mergeMap.set(key, r);
  }
}

function parseInterestOverTimeMulti(
  parsed: unknown,
  kwCount: number,
): InterestTimelinePoint[] {
  if (!isRecord(parsed) || !isRecord(parsed.default)) return [];
  const def = parsed.default as Record<string, unknown>;
  const timeline = def.timelineData;
  if (!Array.isArray(timeline)) return [];
  const out: InterestTimelinePoint[] = [];
  for (const row of timeline) {
    if (!isRecord(row)) continue;
    const label =
      typeof row.formattedAxisTime === "string"
        ? row.formattedAxisTime
        : typeof row.formattedTime === "string"
          ? row.formattedTime
          : "";
    const vals = row.value;
    if (!Array.isArray(vals)) continue;
    const numbers: number[] = [];
    for (let i = 0; i < kwCount; i++) {
      const v = vals[i];
      numbers.push(typeof v === "number" ? v : 0);
    }
    if (label) out.push({ label, values: numbers });
  }
  /** Last ~14 points so the page stays readable (like a compact Trends chart). */
  return out.slice(-16);
}

async function fetchInterestComparison(
  geo: string,
  warnings: string[],
  benchmarks: readonly string[],
): Promise<InterestComparison | null> {
  const keywords = [...benchmarks];
  try {
    const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endTime = new Date();
    const raw = await googleTrends.interestOverTime({
      keyword: [...keywords],
      startTime,
      endTime,
      geo,
      granularTimeResolution: true,
    });
    const parsed = parseJsonSafe(raw);
    if (!parsed) {
      warnings.push("interestOverTime: invalid JSON");
      return null;
    }
    const timeline = parseInterestOverTimeMulti(parsed, keywords.length);
    if (timeline.length === 0) {
      warnings.push("interestOverTime: no timeline rows");
      return null;
    }
    return {
      keywords,
      timeline,
      note: "Numbers are search interest relative to the highest point in this window for each term (100 = peak). Compared equally across terms — same methodology as Google Trends Explore.",
    };
  } catch (e) {
    warnings.push(
      `interestOverTime: ${e instanceof Error ? e.message : "error"}`,
    );
    return null;
  }
}

export interface EducationTrendsPayload {
  geo: string;
  timeframe: EducationTimeframe;
  fetchedAt: string;
  items: EducationTrendRow[];
  /** Grouped copies of items for report sections */
  byGroup: Record<ReportGroup, EducationTrendRow[]>;
  interest: InterestComparison | null;
  /** Merged Top / Rising related queries (Explore-style), from education seeds in this region. */
  explore: EducationExploreSnapshot;
  dataSourcesUsed: string[];
  warnings: string[];
}

const REPORT_ORDER: ReportGroup[] = [
  "exams",
  "colleges",
  "courses",
  "education",
];

function groupItems(items: EducationTrendRow[]): Record<ReportGroup, EducationTrendRow[]> {
  const empty: Record<ReportGroup, EducationTrendRow[]> = {
    exams: [],
    colleges: [],
    courses: [],
    education: [],
  };
  for (const g of REPORT_ORDER) {
    empty[g] = items
      .filter((r) => r.reportGroup === g)
      .sort((a, b) => {
        const order = (s: EducationTrendSource) => {
          if (s.startsWith("realtime")) return 0;
          if (s === "daily_trends") return 1;
          if (s.includes("rising")) return 2;
          return 3;
        };
        const d = order(a.source) - order(b.source);
        if (d !== 0) return d;
        return a.title.localeCompare(b.title);
      });
  }
  return empty;
}

function shouldReplaceRising(
  prev: { direction: ExploreQueryRow["changeDirection"]; strength: number },
  next: { direction: ExploreQueryRow["changeDirection"]; strength: number },
): boolean {
  if (next.direction === "breakout" && prev.direction !== "breakout") return true;
  if (prev.direction === "breakout" && next.direction !== "breakout") return false;
  return next.strength > prev.strength;
}

export async function fetchEducationTrends(
  geo: string,
  options?: { timeframe?: EducationTimeframe },
): Promise<EducationTrendsPayload> {
  mergeMap.clear();
  const dataSourcesUsed: string[] = [];
  const warnings: string[] = [];
  const timeframe: EducationTimeframe = options?.timeframe ?? "past_90_days";
  const { start: windowStart, end: windowEnd } = timeframeToWindow(timeframe);

  const topMap = new Map<string, { query: string; score: number }>();
  const risingMap = new Map<
    string,
    {
      query: string;
      label: string;
      direction: ExploreQueryRow["changeDirection"];
      strength: number;
    }
  >();

  const seedList = geo === "IN" ? INDIA_EDUCATION_SEEDS : SEED_DEFINITIONS;
  const topicAnchors = geo === "IN" ? TOPIC_ANCHORS_IN : TOPIC_ANCHORS;
  const interestBenchmarks =
    geo === "IN" ? INTEREST_BENCHMARKS_IN : INTEREST_BENCHMARKS;

  const relatedJobs = seedList.map(async ({ seed, group }) => {
    try {
      const raw = await googleTrends.relatedQueries({
        keyword: seed,
        geo,
        startTime: windowStart,
        endTime: windowEnd,
      });
      const parsed = parseJsonSafe(raw);
      if (!parsed) {
        warnings.push(`relatedQueries(${seed}): invalid JSON`);
        return;
      }
      dataSourcesUsed.push(`relatedQueries:${seed}`);
      for (const { query, value } of extractRankedKeywords(parsed, "top")) {
        const score = parseTopInterestScore(value);
        const qk = query.toLowerCase();
        const prevT = topMap.get(qk);
        if (!prevT || score > prevT.score) {
          topMap.set(qk, { query, score });
        }
        addRows([
          {
            id: slugId(["rq-top", geo, seed, query]),
            title: query,
            source: "related_queries_top",
            seed,
            reportGroup: group,
            metric: `Top · relative score ${value}`,
            geo,
            exploreUrl: exploreUrl(query, geo),
          },
        ]);
      }
      for (const { query, value } of extractRankedKeywords(parsed, "rising")) {
        const pr = parseRisingDisplay(value);
        const qk = query.toLowerCase();
        const prevR = risingMap.get(qk);
        const row = {
          query,
          label: pr.label,
          direction: pr.direction,
          strength: pr.strength,
        };
        if (!prevR || shouldReplaceRising(prevR, pr)) {
          risingMap.set(qk, row);
        }
        addRows([
          {
            id: slugId(["rq-rise", geo, seed, query]),
            title: query,
            source: "related_queries_rising",
            seed,
            reportGroup: group,
            metric: `Rising · ${value}`,
            geo,
            exploreUrl: exploreUrl(query, geo),
          },
        ]);
      }
    } catch (e) {
      warnings.push(
        `relatedQueries(${seed}): ${e instanceof Error ? e.message : "error"}`,
      );
    }
  });

  const topicJobs = topicAnchors.map(async ({ keyword, group }) => {
    try {
      const raw = await googleTrends.relatedTopics({
        keyword,
        geo,
        startTime: windowStart,
        endTime: windowEnd,
      });
      const parsed = parseJsonSafe(raw);
      if (!parsed) {
        warnings.push(`relatedTopics(${keyword}): invalid JSON`);
        return;
      }
      dataSourcesUsed.push(`relatedTopics:${keyword}`);
      for (const { topic, value } of extractRelatedTopics(parsed, "top")) {
        addRows([
          {
            id: slugId(["rt-top", geo, keyword, topic]),
            title: topic,
            source: "related_topics_top",
            seed: keyword,
            reportGroup: group,
            metric: `Related topic · top · ${value}`,
            geo,
            exploreUrl: exploreUrl(topic, geo),
          },
        ]);
      }
      for (const { topic, value } of extractRelatedTopics(parsed, "rising")) {
        addRows([
          {
            id: slugId(["rt-rise", geo, keyword, topic]),
            title: topic,
            source: "related_topics_rising",
            seed: keyword,
            reportGroup: group,
            metric: `Related topic · rising · ${value}`,
            geo,
            exploreUrl: exploreUrl(topic, geo),
          },
        ]);
      }
    } catch (e) {
      warnings.push(
        `relatedTopics(${keyword}): ${e instanceof Error ? e.message : "error"}`,
      );
    }
  });

  const dailyJob = (async () => {
    try {
      const raw = await googleTrends.dailyTrends({
        geo,
        trendDate: new Date(),
      });
      const parsed = parseJsonSafe(raw);
      if (!parsed) {
        warnings.push("dailyTrends: invalid JSON");
        return;
      }
      dataSourcesUsed.push("dailyTrends");
      addRows(parseDailyEducation(parsed, geo));
    } catch (e) {
      warnings.push(`dailyTrends: ${e instanceof Error ? e.message : "error"}`);
    }
  })();

  const realtimeJob = (async () => {
    try {
      const raw = await googleTrends.realTimeTrends({ geo, category: "all" });
      const parsed = parseJsonSafe(raw);
      if (!parsed) {
        warnings.push("realTimeTrends: invalid JSON");
        return;
      }
      dataSourcesUsed.push("realTimeTrends");
      addRows(parseRealtimeEducation(parsed, geo));
    } catch (e) {
      warnings.push(
        `realTimeTrends: ${e instanceof Error ? e.message : "error"}`,
      );
    }
  })();

  const interestJob = fetchInterestComparison(geo, warnings, interestBenchmarks);

  await Promise.all([
    ...relatedJobs,
    ...topicJobs,
    dailyJob,
    realtimeJob,
  ]);

  const interest = await interestJob;

  const { top: exploreTop, rising: exploreRising } = buildExploreRows({
    topMap,
    risingMap,
    geo,
    limit: 25,
  });
  const explore: EducationExploreSnapshot = {
    timeframe,
    timeframeLabel: timeframeLabel(timeframe),
    top: exploreTop,
    rising: exploreRising,
  };

  const items = Array.from(mergeMap.values()).sort((a, b) => {
    const order = (s: EducationTrendSource) => {
      if (s.startsWith("realtime")) return 0;
      if (s === "daily_trends") return 1;
      if (s.includes("rising")) return 2;
      return 3;
    };
    const d = order(a.source) - order(b.source);
    if (d !== 0) return d;
    const g = REPORT_ORDER.indexOf(a.reportGroup) - REPORT_ORDER.indexOf(b.reportGroup);
    if (g !== 0) return g;
    return a.title.localeCompare(b.title);
  });

  return {
    geo,
    timeframe,
    fetchedAt: new Date().toISOString(),
    items,
    byGroup: groupItems(items),
    interest,
    explore,
    dataSourcesUsed,
    warnings,
  };
}

export const educationReportSections: Array<{
  group: ReportGroup;
  title: string;
  description: string;
}> = [
  {
    group: "exams",
    title: "Exams & assessments",
    description:
      "Rising and top related queries around standardized tests, entrance exams, and prep — same Top / Rising framing as Google Trends.",
  },
  {
    group: "colleges",
    title: "Colleges & admissions",
    description:
      "University, admissions, aid, and campus-related momentum in your region.",
  },
  {
    group: "courses",
    title: "Courses & credentials",
    description:
      "Online courses, bootcamps, certificates, and program-style searches.",
  },
  {
    group: "education",
    title: "Broader education",
    description:
      "K-12, EdTech, teaching, and general education topics plus shared baseline topics.",
  },
];
