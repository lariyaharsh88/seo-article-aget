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
  /\b(education|educational|edtech|e-learning|elearning|school|schools|campus|universit(y|ies)|college|student(s)?|teacher(s)?|classroom|curriculum|homework|exam(s)?|test prep|quiz|NCERT|CBSE|SAT|ACT|GRE|GMAT|LSAT|MCAT|IELTS|TOEFL|JEE|NEET|UPSC|GATE|scholarship|tuition|admission(s)?|enrollment|degree|MBA|PhD|doctorate|STEM|MOOC|online course|certification|bootcamp|distance learning|kindergarten|K-12|high school|middle school|homeschool|FAFSA|student loan|academic|learn(ing)?|lecture|pedagogy|syllabus|semester|credit hour)\b/i;

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

/** Anchor topics for relatedTopics (same four chapters as the report). */
const TOPIC_ANCHORS: Array<{ keyword: string; group: ReportGroup }> = [
  { keyword: "standardized test", group: "exams" },
  { keyword: "university admissions", group: "colleges" },
  { keyword: "online learning courses", group: "courses" },
  { keyword: "public education", group: "education" },
];

/** Benchmark terms for a multi-series interest-over-time strip (Google-style 0–100 index). */
const INTEREST_BENCHMARKS = [
  "SAT",
  "college admissions",
  "online courses",
  "education",
] as const;

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
): Promise<InterestComparison | null> {
  const keywords = [...INTEREST_BENCHMARKS];
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
  fetchedAt: string;
  items: EducationTrendRow[];
  /** Grouped copies of items for report sections */
  byGroup: Record<ReportGroup, EducationTrendRow[]>;
  interest: InterestComparison | null;
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

export async function fetchEducationTrends(
  geo: string,
): Promise<EducationTrendsPayload> {
  mergeMap.clear();
  const dataSourcesUsed: string[] = [];
  const warnings: string[] = [];

  const windowStart = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const windowEnd = new Date();

  const relatedJobs = SEED_DEFINITIONS.map(async ({ seed, group }) => {
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

  const topicJobs = TOPIC_ANCHORS.map(async ({ keyword, group }) => {
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

  const interestJob = fetchInterestComparison(geo, warnings);

  await Promise.all([
    ...relatedJobs,
    ...topicJobs,
    dailyJob,
    realtimeJob,
  ]);

  const interest = await interestJob;

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
    fetchedAt: new Date().toISOString(),
    items,
    byGroup: groupItems(items),
    interest,
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
