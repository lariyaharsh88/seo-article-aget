import { unstable_cache } from "next/cache";
import { geminiText } from "@/lib/gemini";

export const TOOL_EXPLAINER_IDS = [
  "seo-agent",
  "off-page-seo",
  "education-trends",
  "education-news",
  "ai-seo-toolkit",
  "repurpose-url",
  "blogs",
  "news",
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
  "ai-seo-toolkit": {
    name: "AI SEO Toolkit",
    path: "/ai-seo-toolkit",
    facts: [
      "Three tabs: AI visibility (brand/keyword mentions in LLM-style answers), prompt mining (Google Suggest + related queries), and AEO content optimizer with local scoring.",
      "Uses Next.js API routes; visibility and prompts call server endpoints; optimizer scores content against a keyword in-browser.",
      "OpenRouter may be used where configured for some AI-facing flows; SQLite or Prisma may back stored visibility logs depending on deployment.",
      "MVP scope: research and experimentation—not a replacement for rank tracking SaaS or Search Console.",
    ],
  },
  "repurpose-url": {
    name: "Repurpose from URL",
    path: "/repurpose-url",
    facts: [
      "Accepts a single public HTTPS article URL and runs the same multi-stage pipeline as /seo-agent: keywords, Tavily research, SERP, outline, streaming Gemini article, SEO audit, optional visual enrich.",
      "Resolves topic from page title via /api/page-meta when no topic override is provided.",
      "Does not copy source text verbatim; outputs a new draft aligned to RankFlowHQ SEO prompts.",
      "Requires GEMINI_API_KEY, TAVILY_API_KEY, SERPER_API_KEY on the server; some publisher sites block server-side fetch.",
    ],
  },
  blogs: {
    name: "Blog index",
    path: "/blogs",
    facts: [
      "Lists published BlogPost rows from PostgreSQL; only posts with published=true appear.",
      "Supports pagination (?page=) with cached per-page lists for performance.",
      "Individual posts live under /blogs/[slug]; creation and editing use /blog-create with NextAuth for the configured admin.",
      "Content is editorial and product-focused for RankFlowHQ—not user-generated from anonymous visitors.",
    ],
  },
  news: {
    name: "News index (repurposed articles)",
    path: "/news",
    facts: [
      "Lists EducationNewsArticle rows with repurposeStatus ready, repurposed slug, and markdown; pagination with ?page=.",
      "Articles are AI-repurposed education headlines for SEO on this domain; each item links to /news/[slug].",
      "Sitemap at /news/sitemap.xml for Google News-style discovery when configured.",
      "Distinct from /education-news which scans third-party sitemaps for discovery before repurposing.",
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

  "ai-seo-toolkit": `## What this tool does

The **AI SEO Toolkit** helps you connect classic search thinking with **answer-engine** behaviour: whether a brand or topic tends to appear in AI-style answers, which prompts and questions cluster around a seed, and how well a draft scores for a target keyword in a lightweight optimizer. It is aimed at SEOs and editors experimenting with **AEO (answer engine optimisation)** alongside traditional rankings.

## How to use it

Use the **Visibility** tab to test a domain against a small list of keywords (server-side analysis). Use **Prompts** to expand a seed into related queries (useful for briefs and FAQs). Use **Optimize** to paste draft content and a keyword to get a score and suggested improvements—iterate in your editor, not as legal or financial advice.

## Limits

Results depend on APIs, models, and heuristics in this MVP. They are not a substitute for rank trackers, Search Console, or compliance review. **OpenRouter** and database features vary by how your deployment is configured.

## Fit with the site

Pair with the **SEO article pipeline** for long-form drafts and **Off-page SEO** when you move from content to outreach planning.
`,

  "repurpose-url": `## What this tool does

**Repurpose from URL** takes a single public **page or article URL** and runs the **full RankFlowHQ article pipeline**—the same stages as the main SEO article tool: keyword signals, Tavily research, SERP context, structured outline, streaming long-form draft from Gemini, SEO meta audit, and optional **visual HTML** enrichment (H2 images, charts, tables). The goal is a **new, SEO-oriented article** for your site, not a copy of the source.

## How to use it

Paste an **https://** URL. Optionally add a topic line, audience, intent, or primary keyword. Leave the topic blank to use the **live page title** (resolved server-side). Enable **Auto-enrich** unless you only want Markdown. Respect the source site’s terms and copyright: this tool is for research and transformation, not republication of third-party text as-is.

## Limits

Some hosts block server fetches; title or research may degrade. You need valid API keys on the server (Gemini, Tavily, Serper). Very short or non-article URLs may produce weak outlines—prefer real article pages.

## Fit with the site

If you already have a topic in mind, use **Article pipeline**; if you start from an example URL, use this page. Finished pieces can inform **Blog** posts or internal links.
`,

  blogs: `## What this page is

The **Blog** index lists **published** articles from RankFlowHQ: product notes, SEO tooling updates, and editorial content stored in the database. Each card links to a full post under **/blogs/[slug]**. Pagination keeps the list readable as the archive grows (**?page=** for older pages).

## How to use it

Browse by date, open posts that match your interest, and follow internal links to tools. Authors publish through the secured **Blog CMS** (\`/blog-create\`); only rows marked **published** appear here—drafts stay out of the index.

## Limits

This is not a community forum or user-generated feed. Update frequency depends on your team. For **education news** stories generated on-site, use the **News** section instead.

## Fit with the site

Use **Blog** for evergreen company and product narrative; pair with **News** for repurposed education headlines and with **Article pipeline** when drafting new long-form guides.
`,

  news: `## What this page is

The **News** index lists **repurposed education news articles** published on RankFlowHQ: exam updates, boards, higher education, and related topics processed as SEO-friendly stories under **/news/[slug]**. Each line shows source metadata and the repurposed date. Pagination uses **?page=** like the blog.

## How to use it

Scan headlines, open full articles, and use “View original source” on article pages when you need the publisher’s wording. Content is produced for readers in India and similar markets; tone and structure follow on-site SEO prompts, not wire feeds.

## Limits

Only articles that finished repurposing (**ready** status) appear. Volume depends on your **Education news** digest and automation settings. This section does not replace official boards or government websites for deadlines and rules.

## Fit with the site

Use **Education news** (digest) to discover items to repurpose; use **News** (this index) to read finished on-domain stories. Combine with **Education Google Trends** for demand context and with the **Article pipeline** when writing original guides.
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
  // During `next build`, never call external LLM APIs from static generation.
  // Build workers are time-limited and repeated AI calls can trigger SSG timeouts.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return FALLBACK[id];
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return FALLBACK[id];

  try {
    const raw = await Promise.race([
      geminiText(buildPrompt(id), apiKey, {
        temperature: 0.35,
        maxOutputTokens: 3072,
      }),
      new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error("tool-explainer timeout")), 8000);
      }),
    ]);
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
