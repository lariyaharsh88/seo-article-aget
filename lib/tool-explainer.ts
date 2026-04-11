import { unstable_cache } from "next/cache";
import { geminiText } from "@/lib/gemini";

export const TOOL_EXPLAINER_IDS = [
  "seo-agent",
  "off-page-seo",
  "education-trends",
  "education-news",
] as const;

export type ToolExplainerId = (typeof TOOL_EXPLAINER_IDS)[number];

const SPECS: Record<
  ToolExplainerId,
  { name: string; path: string; facts: string[] }
> = {
  "seo-agent": {
    name: "RankFlowHQ article pipeline",
    path: "/seo-agent",
    facts: [
      "Part of the RankFlowHQ suite; runs a multi-stage pipeline in the browser backed by Next.js API routes.",
      "Uses Serper for SERP/keywords/PAA, Tavily for research, Gemini for outline and streaming article and audit.",
      "Optional Google Search Console queries and Google Suggest when configured.",
      "Outputs Markdown article, keyword list, sources, SEO meta JSON, and optional SVG infographics from numbers in research text (no separate image API).",
      "Requires server-side API keys in env: GEMINI_API_KEY, TAVILY_API_KEY, SERPER_API_KEY; GSC is optional.",
    ],
  },
  "off-page-seo": {
    name: "Off-page SEO — backlink outreach planner",
    path: "/off-page-seo",
    facts: [
      "Accepts a seed domain, country, and niche to drive Google search discovery via Serper (no direct Google scrape in MVP).",
      "Aggregates competitor-adjacent and niche sites from multiple SERP queries, deduplicates hosts, and filters major platforms.",
      "Estimates Moz-like DA and traffic bands from SERP visibility heuristics; spam score from snippet text — not live Moz API unless you add keys later.",
      "Fetches public HTML pages (contact, about, home) with fetch + cheerio to extract emails and social links; best-effort only.",
      "Prices guest-post style outreach in INR bands from estimated DA; Gemini refines priority scores and actions when GEMINI_API_KEY is set.",
      "Requires SERPER_API_KEY; GEMINI_API_KEY optional for AI ranking; no PostgreSQL/Redis required in this MVP.",
    ],
  },
  "education-trends": {
    name: "Education Google Trends explorer",
    path: "/education-trends",
    facts: [
      "Displays Google Trends–style data for education-focused seeds (India and other geos).",
      "Shows Top/Rising queries, interest-over-time style visuals, and related query tables depending on data returned.",
      "Uses server-side fetching with caching; results depend on third-party Trends availability and rate limits.",
      "URL query params control geo, timeframe, and scope (e.g. lite vs full).",
    ],
  },
  "education-news": {
    name: "Education news digest",
    path: "/education-news",
    facts: [
      "Aggregates recent article links from public education publisher sitemaps (e.g. Shiksha, Careers360, Jagran Josh, Testbook).",
      "Lets users filter by source and open previews; data is refreshed on server requests.",
      "Does not host full article text; titles and links point to original publishers.",
      "Intended as a research and monitoring aid, not a replacement for reading sources directly.",
    ],
  },
};

const FALLBACK: Record<ToolExplainerId, string> = {
  "seo-agent": `## What this tool does

The **RankFlowHQ article pipeline** turns a topic (or a source URL) into a structured, research-backed draft and an SEO export pack. It is built for marketers, editors, and SEOs who need a strong first draft with citations and meta fields—not a substitute for editorial judgment or fact-checking.

## How it works

Stages typically include keyword discovery, Tavily-powered research, SERP context, an outline, a **streaming** long-form article from Gemini, and an audit that proposes title, description, and schema-oriented metadata. Optional connections include Search Console queries and Google Suggest when your deployment is configured with the right keys.

## Outputs

You get Markdown you can edit, a keyword list, source URLs, and a JSON SEO package. **Data infographics** are generated from numeric lines in your research text as SVG layouts (no separate “AI image” service).

## Limits

Quality depends on API availability, model limits, and the quality of sources Tavily returns. Always verify facts, quotes, and statistics before publishing. Keys must be set securely on the server (\`GEMINI_API_KEY\`, \`TAVILY_API_KEY\`, \`SERPER_API_KEY\`; GSC optional).
`,

  "off-page-seo": `## What this tool does

The **off-page SEO planner** helps you build a prioritized outreach list: who might accept guest posts or links, rough authority and price bands, and any public email or social handles the site exposes. It is an **MVP research workflow**, not a replacement for Ahrefs/Moz or manual vetting.

## How it works

Discovery uses **Serper** (Google results API) with niche/country queries. Each domain is scored from how often and how highly it appears across those SERPs. Contacts come from crawling common paths such as /contact and /about over HTTPS — many sites block bots or hide emails, so rows may lack an address.

## Pricing and priority

INR ranges follow a simple DA band model. **Gemini** (when configured) re-ranks rows with categories and short actions. Without Gemini, rule-based scores apply.

## Limits

No BullMQ/Postgres in this build: one request runs the full enrichment. Respect robots and rate limits; verify deliverability and site quality before paying for placements. Add Moz/Ahrefs APIs later for live domain metrics.

## Fit with the site

Use after **keyword/topic research** (article pipeline or trends) to target sites where your niche content fits.
`,

  "education-trends": `## What this tool does

The **Education Google Trends** view surfaces search interest patterns for education-related seeds in selected regions and time windows. It helps content and SEO teams spot rising questions, compare query types, and align editorial calendars with demand signals.

## How to use it

Choose geography, timeframe, and scope from the page controls. Tables and charts reflect the data the server could retrieve for that request. Use the links to open Google Trends where deeper exploration is useful.

## Limits

Trends data is provided by third-party flows and may be incomplete, delayed, or rate-limited. Numbers are indicative, not guarantees of traffic to your site. This page does not replace Trends or analytics products for production reporting.

## Fit with the site

It complements the **SEO article pipeline** (for drafting) and the **education news** digest (for headlines)—together they support research from signals to narrative.
`,

  "education-news": `## What this tool does

The **Education news digest** lists recent articles discovered via public sitemaps from major education publishers. It is a **scanner**: quick access to titles, sources, and links so you can jump to originals.

## How to use it

Filter by source, scan the grid, and use previews where available. Treat every item as a pointer to the publisher’s site for full text and licensing.

## Limits

Listing here does not imply endorsement. Coverage depends on sitemap freshness and server fetch success. Always read articles on the publisher’s domain for authoritative content and updates.

## Fit with the site

Use alongside **Education Trends** for query demand and the **SEO article pipeline** when you turn research into long-form content.
`,
};

function buildPrompt(id: ToolExplainerId): string {
  const s = SPECS[id];
  const factLines = s.facts.map((x) => `- ${x}`).join("\n");
  return `You are writing the footer "Guide" section for a web app page. Output ONLY Markdown (no surrounding code fences). Use ## for 3–5 main sections and ### only if needed.

Tool: ${s.name}
URL path: ${s.path}

Verified facts (stay within these; do not invent integrations or guarantees):
${factLines}

Write 550–900 words. Cover: what problem it solves, who it is for, how it works at a high level, limitations (APIs, third-party data, not legal/financial advice), and how it relates to other tools on the same site (SEO pipeline, off-page planner, trends, news). Tone: professional, concise, not salesy. No emojis. Do not repeat the URL as a bare link unless in a short "Where to find it" line.`;
}

async function generateExplainer(id: ToolExplainerId): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return FALLBACK[id];

  try {
    const raw = await geminiText(buildPrompt(id), apiKey, {
      temperature: 0.35,
      maxOutputTokens: 3072,
    });
    const t = raw.trim().replace(/^```markdown\s*/i, "").replace(/```\s*$/i, "");
    if (t.length < 220) return FALLBACK[id];
    return t;
  } catch {
    return FALLBACK[id];
  }
}

const cachedExplainer = unstable_cache(
  async (id: ToolExplainerId) => generateExplainer(id),
  ["tool-explainer-md"],
  { revalidate: 86_400 },
);

export async function getToolExplainerMarkdown(
  id: ToolExplainerId,
): Promise<string> {
  return cachedExplainer(id);
}
