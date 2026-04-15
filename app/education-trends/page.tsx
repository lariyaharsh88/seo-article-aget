import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { InterestOverTimeChart } from "@/components/InterestOverTimeChart";
import { JsonLd } from "@/components/JsonLd";
import { ToolExplainerSection } from "@/components/ToolExplainerSection";
import {
  fetchEducationTrends,
  parseEducationFetchScope,
  parseEducationTimeframe,
  type EducationFetchScope,
  type EducationTimeframe,
  type EducationTrendRow,
  type ExploreQueryRow,
} from "@/lib/education-trends";
import { getRequestSiteOrigin } from "@/lib/request-site-origin";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildToolWebApplicationSchema } from "@/lib/schema-org";
import { getToolExplainerMarkdown } from "@/lib/tool-explainer";

const ED_TRENDS_DESC =
  "Education Google Trends: top and rising queries, interest-over-time charts, India-focused seeds, geo presets (IN, US, GB, AU, CA), and exportable signals for editorial planning.";

const educationTrendsSchema = buildToolWebApplicationSchema({
  path: "/education-trends",
  name: "Education Google Trends explorer",
  headline: "Explore education searches",
  description: ED_TRENDS_DESC,
});

export async function generateMetadata(): Promise<Metadata> {
  const siteOrigin = await getRequestSiteOrigin();
  return buildPageMetadata({
    title: "Education Google Trends — Top & Rising Queries",
    description: ED_TRENDS_DESC,
    path: "/education-trends",
    siteOrigin,
    keywords: [
      "education Google Trends",
      "keyword research India",
      "rising searches",
      "interest over time",
      "education keywords",
    ],
  });
}

const GEO_PRESETS = ["IN", "US", "GB", "AU", "CA"] as const;

const TIMEFRAMES: { id: EducationTimeframe; label: string }[] = [
  { id: "past_1_hour", label: "Past hour" },
  { id: "past_4_hours", label: "Past 4 hours" },
  { id: "past_24_hours", label: "Past 24 hours" },
  { id: "past_7_days", label: "Past 7 days" },
  { id: "past_90_days", label: "Past 90 days" },
];

function sourceLabel(source: EducationTrendRow["source"]): string {
  switch (source) {
    case "realtime_trends":
      return "Realtime";
    case "daily_trends":
      return "Daily";
    case "related_queries_rising":
      return "Related Q · Rising";
    case "related_queries_top":
      return "Related Q · Top";
    case "related_topics_rising":
      return "Related topic · Rising";
    case "related_topics_top":
      return "Related topic · Top";
    default:
      return source;
  }
}

function sourceStyle(source: EducationTrendRow["source"]): string {
  if (source === "realtime_trends") return "bg-info/15 text-info";
  if (source === "daily_trends") return "bg-purple/20 text-purple";
  if (source.includes("rising")) return "bg-accent/15 text-accent";
  return "bg-text-muted/20 text-text-secondary";
}

function changeCellClass(dir: ExploreQueryRow["changeDirection"]): string {
  if (dir === "breakout") return "font-semibold text-purple";
  if (dir === "up") return "text-success";
  if (dir === "down") return "text-rose-400";
  return "text-text-muted";
}

function queryTypeBadgeStyle(kind: "breakout" | "rising" | "top"): string {
  if (kind === "breakout") return "bg-purple/20 text-purple";
  if (kind === "rising") return "bg-accent/15 text-accent";
  return "bg-info/15 text-info";
}

function qs(geo: string, tf: EducationTimeframe, scope: EducationFetchScope): string {
  const p = new URLSearchParams();
  p.set("geo", geo);
  p.set("tf", tf);
  if (scope === "full") p.set("scope", "full");
  return p.toString();
}

const getCachedEducationTrends = unstable_cache(
  async (geo: string, timeframe: EducationTimeframe, scope: EducationFetchScope) =>
    fetchEducationTrends(geo, { timeframe, scope }),
  ["education-trends-v13-formatted-value-scores"],
  { revalidate: 900 },
);

export default async function EducationTrendsPage({
  searchParams,
}: {
  searchParams:
    | Promise<{ geo?: string; tf?: string; scope?: string }>
    | { geo?: string; tf?: string; scope?: string };
}) {
  const sp = await Promise.resolve(searchParams);
  const rawGeo = typeof sp.geo === "string" ? sp.geo : "IN";
  const geo = rawGeo.trim().toUpperCase() || "IN";
  const timeframe = parseEducationTimeframe(sp.tf);
  const scope = parseEducationFetchScope(sp.scope);
  const explainerMd = await getToolExplainerMarkdown("education-trends");
  let data:
    | Awaited<ReturnType<typeof getCachedEducationTrends>>
    | null = null;
  let loadError: string | null = null;
  try {
    data = await getCachedEducationTrends(geo, timeframe, scope);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load trends data";
  }

  const fullWidthRows =
    data == null
      ? []
      : [
          ...data.explore.breakouts.map((r) => ({ kind: "breakout" as const, row: r })),
          ...data.explore.rising.map((r) => ({ kind: "rising" as const, row: r })),
          ...data.explore.top.map((r) => ({ kind: "top" as const, row: r })),
        ];

  if (!data) {
    return (
      <>
        <JsonLd data={educationTrendsSchema} />
      <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-5">
          <h1 className="font-display text-2xl text-amber-100">
            Education trends temporarily unavailable
          </h1>
          <p className="mt-2 font-serif text-sm text-amber-100/90">
            The server could not load Google Trends data for this request. This is usually
            temporary and may happen when Google limits automated requests.
          </p>
          <p className="mt-3 font-mono text-xs text-amber-200/80">
            Error: {loadError ?? "Unknown server error"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/education-trends?${qs(geo, "past_7_days", "lite")}`}
              className="rounded-lg border border-amber-300/30 px-3 py-1.5 font-mono text-xs text-amber-100 hover:bg-amber-900/30"
            >
              Retry fast mode
            </Link>
            <Link
              href={`/education-trends?${qs(geo, "past_90_days", "lite")}`}
              className="rounded-lg border border-amber-300/30 px-3 py-1.5 font-mono text-xs text-amber-100 hover:bg-amber-900/30"
            >
              Try past 90 days
            </Link>
          </div>
        </div>
        <ToolExplainerSection markdown={explainerMd} />
      </main>
      </>
    );
  }

  return (
    <>
      <JsonLd data={educationTrendsSchema} />
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-8 space-y-3 border-b border-border pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Google Trends · Education
        </p>
        <h1 className="font-display text-3xl text-text-primary md:text-4xl">
          Explore education searches
        </h1>
        <p className="max-w-3xl font-serif text-sm leading-relaxed text-text-secondary">
          <strong className="font-medium text-text-primary">Tabular</strong> Top / Rising lists
          (like Explore) plus an <strong className="font-medium text-text-primary">interest-over-time</strong>{" "}
          chart for benchmark keywords. Default mode uses fewer background requests so the page loads
          faster; switch to “Full report” for related topics, daily, and realtime extras. Data via{" "}
          <a
            href="https://www.npmjs.com/package/google-trends-api"
            className="text-info underline-offset-2 hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            google-trends-api
          </a>
          , cached ~15 minutes.
        </p>
        <p className="font-mono text-xs text-text-muted">
          Fetched {new Date(data.fetchedAt).toLocaleString()} · {data.explore.timeframeLabel} ·
          Scope:{" "}
          <strong className="text-text-secondary">
            {data.fetchScope === "lite" ? "Fast (lite)" : "Full report"}
          </strong>
        </p>
      </div>

      {/* Filters — compact toolbar */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-border bg-surface/80 px-4 py-3 backdrop-blur-sm md:flex-row md:flex-wrap md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase text-text-muted">Region</span>
          <div className="flex flex-wrap gap-1">
            {GEO_PRESETS.map((g) => (
              <Link
                key={g}
                href={`/education-trends?${qs(g, timeframe, scope)}`}
                className={`rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors ${
                  g === geo
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-text-secondary hover:border-accent hover:text-accent"
                }`}
              >
                {g === "IN" ? "India" : g}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase text-text-muted">Time window</span>
          <div className="flex flex-wrap gap-1">
            {TIMEFRAMES.map((t) => (
              <Link
                key={t.id}
                href={`/education-trends?${qs(geo, t.id, scope)}`}
                className={`rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors ${
                  t.id === timeframe
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-text-secondary hover:border-accent hover:text-accent"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase text-text-muted">Data depth</span>
          <div className="flex gap-1">
            <Link
              href={`/education-trends?${qs(geo, timeframe, "lite")}`}
              className={`rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors ${
                scope === "lite"
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border text-text-secondary hover:border-accent hover:text-accent"
              }`}
            >
              Fast
            </Link>
            <Link
              href={`/education-trends?${qs(geo, timeframe, "full")}`}
              className={`rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors ${
                scope === "full"
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border text-text-secondary hover:border-accent hover:text-accent"
              }`}
            >
              Full report
            </Link>
          </div>
        </div>
      </div>

      {data.explore.relatedQueriesWindowNote ? (
        <div
          className="mb-6 rounded-xl border border-info/35 bg-info/10 px-4 py-3 font-serif text-sm leading-relaxed text-text-secondary"
          role="note"
        >
          {data.explore.relatedQueriesWindowNote}
        </div>
      ) : null}

      {/* Chart — Google-style multi-series */}
      <section className="mb-8 rounded-xl border border-border bg-surface/80 px-4 py-5 md:px-6">
        <h2 className="font-display text-lg text-text-primary md:text-xl">
          Interest over time
        </h2>
        <p className="mt-1 font-serif text-xs text-text-muted">
          Compared benchmark keywords (0–100 index, same method as Google Trends). The chart matches
          your selected time window; related-query tables may use a longer lookback when 1h–24h lists
          would otherwise be empty.
        </p>
        <div className="mt-4">
          <InterestOverTimeChart interest={data.interest} />
        </div>
      </section>

      <div className="mb-8">
        <ExploreTableCard
          title="Breakout queries"
          hint="Rising searches flagged as BREAKOUT or extreme +% spikes (same rules as Google Trends explore). Listed separately from ordinary percentage growth."
          rows={data.explore.breakouts}
          variant="breakout"
        />
      </div>

      {fullWidthRows.length > 0 ? (
        <section className="mb-8">
          <h2 className="font-display text-xl text-text-primary">Top / Rising / Breakout (full table)</h2>
          <p className="mt-1 font-serif text-xs text-text-muted">
            Full-width view with query score, change label, and direct Trends links.
          </p>
          <div className="custom-scrollbar mt-4 overflow-x-auto rounded-xl border border-border bg-surface/80">
            <table className="w-full min-w-[760px] border-collapse text-left font-serif text-sm">
              <thead>
                <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Query</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Change</th>
                  <th className="px-4 py-3">Explore</th>
                </tr>
              </thead>
              <tbody>
                {fullWidthRows.map(({ kind, row }) => (
                  <tr
                    key={`full-width-${kind}-${row.rank}-${row.query}`}
                    className="border-b border-border/80 transition-colors hover:bg-background/40"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 font-mono text-[10px] uppercase ${queryTypeBadgeStyle(kind)}`}
                      >
                        {kind}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-xs text-text-muted">
                      {row.rank}
                    </td>
                    <td className="px-4 py-3 text-text-primary">{row.query}</td>
                    <td className="px-4 py-3 font-mono tabular-nums text-xs text-text-secondary">
                      {row.interest}
                    </td>
                    <td className={`px-4 py-3 font-mono text-xs ${changeCellClass(row.changeDirection)}`}>
                      {row.changeLabel}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={row.exploreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-info underline-offset-2 hover:underline"
                      >
                        Open in Trends ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {data.userNotice ? (
        <div
          className="mb-6 overflow-hidden rounded-xl border border-amber-500/40 bg-amber-950/25"
          role="status"
        >
          <div className="border-b border-amber-500/20 px-4 py-3">
            <p className="font-mono text-sm font-semibold text-amber-100">
              {data.userNotice.headline}
            </p>
            <p className="mt-2 font-serif text-sm leading-relaxed text-amber-100/90">
              {data.userNotice.body}
            </p>
            <p className="mt-2 font-serif text-xs leading-relaxed text-amber-200/80">
              {data.userNotice.statsLine}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              What you can try
            </p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 font-serif text-sm text-text-secondary">
              {data.userNotice.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ol>
            <details className="mt-4 rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-[11px] text-text-muted">
              <summary className="cursor-pointer select-none text-text-secondary">
                Technical details ({data.userNotice.stats.total})
              </summary>
              <ul className="mt-2 max-h-52 list-disc space-y-1 overflow-y-auto pl-5">
                {data.userNotice.technicalPreview.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
              {data.userNotice.technicalExtraCount > 0 ? (
                <p className="mt-2 opacity-80">
                  … and {data.userNotice.technicalExtraCount} more
                </p>
              ) : null}
            </details>
          </div>
        </div>
      ) : null}

      {data.explore.top.length === 0 &&
      data.explore.rising.length === 0 &&
      data.explore.breakouts.length === 0 ? (
        <div className="mb-6 rounded-xl border border-border bg-surface/60 p-8 text-center font-serif text-sm text-text-secondary">
          No Top / Rising / Breakout queries for this region and window. Try a longer range (e.g.
          Past 7 or 90 days) or refresh later — very short windows sometimes return no data.
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <ExploreTableCard
            title="Top queries"
            hint="Merged “top” related queries across education seeds — interest bar is relative within this table."
            rows={data.explore.top}
          />
          <ExploreTableCard
            title="Rising queries (% change)"
            hint="Merged “rising” lists with +% style growth only. True breakouts are listed in the Breakout section directly under the chart."
            rows={data.explore.rising}
          />
        </div>
      </div>

      {data.fetchScope === "full" && data.items.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl text-text-primary">All merged signals</h2>
          <p className="mt-1 font-serif text-xs text-text-muted">
            Related topics, daily, realtime (full report only), deduped by title.
          </p>
          <div className="custom-scrollbar mt-4 overflow-x-auto rounded-xl border border-border bg-surface/80">
            <table className="w-full min-w-[640px] border-collapse text-left font-serif text-sm">
              <thead>
                <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3">Topic</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Metric</th>
                  <th className="px-4 py-3">Explore</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/80 transition-colors hover:bg-background/40"
                  >
                    <td className="px-4 py-3 text-text-primary">{row.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 font-mono text-[10px] uppercase ${sourceStyle(row.source)}`}
                      >
                        {sourceLabel(row.source)}
                      </span>
                      {row.seed ? (
                        <span className="mt-1 block font-mono text-[10px] text-text-muted">
                          Seed: {row.seed}
                        </span>
                      ) : null}
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-text-secondary">{row.metric}</td>
                    <td className="px-4 py-3">
                      <a
                        href={row.exploreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-info underline-offset-2 hover:underline"
                      >
                        Open in Trends ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <p className="mt-8 font-mono text-[10px] leading-relaxed text-text-muted">
        Sources: {data.dataSourcesUsed.join(", ") || "—"}
      </p>

      <ToolExplainerSection markdown={explainerMd} />
    </main>
    </>
  );
}

function ExploreTableCard({
  title,
  hint,
  rows,
  variant = "default",
}: {
  title: string;
  hint: string;
  rows: ExploreQueryRow[];
  variant?: "default" | "breakout";
}) {
  const shell =
    variant === "breakout"
      ? "flex flex-col overflow-hidden rounded-xl border border-purple-500/40 bg-purple-950/15 shadow-[inset_0_1px_0_0_rgba(167,139,250,0.1)]"
      : "flex flex-col overflow-hidden rounded-xl border border-border bg-surface/80";
  const barAccent = variant === "breakout" ? "purple" : "info";
  return (
    <section className={shell}>
      <div
        className={
          variant === "breakout"
            ? "border-b border-purple-500/25 px-4 py-3"
            : "border-b border-border px-4 py-3"
        }
      >
        <h2 className="font-display text-lg text-text-primary">{title}</h2>
        <p className="mt-1 font-serif text-xs text-text-muted">{hint}</p>
      </div>
      {rows.length === 0 ? (
        <div className="flex-1 px-4 py-10 text-center">
          {variant === "breakout" ? (
            <>
              <p className="font-serif text-sm text-text-secondary">
                No breakout queries in this window. Google only labels a small share of rising terms
                as Breakout; very short ranges often return none.
              </p>
              <p className="mt-3 font-serif text-xs text-text-muted">
                Try <strong className="font-medium text-text-secondary">Past 7 or 90 days</strong>{" "}
                or enable <strong className="font-medium text-text-secondary">Full report</strong>{" "}
                for related topics and extra signals. Breakout-style rows from merged sources are
                included here when detected.
              </p>
            </>
          ) : (
            <p className="font-serif text-sm text-text-muted">No rows.</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px] border-collapse font-serif text-sm">
            <thead>
              <tr
                className={
                  variant === "breakout"
                    ? "border-b border-purple-500/20 bg-purple-950/25 font-mono text-[10px] uppercase tracking-wide text-text-muted"
                    : "border-b border-border bg-background/30 font-mono text-[10px] uppercase tracking-wide text-text-muted"
                }
              >
                <th className="w-10 px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Query</th>
                <th className="hidden min-w-[140px] px-3 py-2 text-left sm:table-cell">
                  Interest
                </th>
                <th className="min-w-[88px] px-3 py-2 text-right">Δ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`ExploreTableCard-${variant}-${row.rank}-${row.query}`}
                  className={
                    variant === "breakout"
                      ? "border-b border-purple-500/15 hover:bg-purple-950/20"
                      : "border-b border-border/70 hover:bg-background/35"
                  }
                >
                  <td className="px-3 py-2.5 font-mono tabular-nums text-xs text-text-muted">
                    {row.rank}
                  </td>
                  <td className="max-w-[200px] px-3 py-2.5 sm:max-w-none">
                    <a
                      href={row.exploreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        variant === "breakout"
                          ? "font-medium text-purple hover:underline"
                          : "font-medium text-info hover:underline"
                      }
                    >
                      {row.query}
                    </a>
                    <div className="mt-1.5 sm:hidden">
                      <InterestBar value={row.interest} accent={barAccent} />
                    </div>
                  </td>
                  <td className="hidden px-3 py-2.5 sm:table-cell">
                    <InterestBar value={row.interest} accent={barAccent} />
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right font-mono text-xs ${changeCellClass(row.changeDirection)}`}
                  >
                    <span className="inline-flex items-center justify-end gap-0.5">
                      {row.changeDirection === "up" ? <ArrowUp /> : null}
                      {row.changeDirection === "down" ? <ArrowDown /> : null}
                      {row.changeLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function InterestBar({
  value,
  accent = "info",
}: {
  value: number;
  accent?: "info" | "purple";
}) {
  const w = Math.max(4, Math.min(100, value));
  const fill = accent === "purple" ? "bg-purple" : "bg-info";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 min-w-[80px] flex-1 overflow-hidden rounded-sm bg-border">
        <div className={`h-full rounded-sm ${fill}`} style={{ width: `${w}%` }} />
      </div>
      <span className="font-mono tabular-nums text-xs text-text-muted">{value}</span>
    </div>
  );
}

function ArrowUp() {
  return (
    <svg className="h-3 w-3 text-success" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path fillRule="evenodd" d="M10 5l5 5H5l5-5z" clipRule="evenodd" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg className="h-3 w-3 text-rose-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path fillRule="evenodd" d="M10 15l-5-5h10l-5 5z" clipRule="evenodd" />
    </svg>
  );
}
