import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ListPagination } from "@/components/ListPagination";
import { formatSourceIssueTimeIst } from "@/lib/education-news/format-source-issue-time";
import { listReadyRepurposedNewsPage } from "@/lib/education-news/repurposed-news-query";
import { LIST_PAGE_SIZE, parseListPageParam } from "@/lib/list-pagination";
import { ToolExplainerSection } from "@/components/ToolExplainerSection";
import { buildNewsIndexSchema } from "@/lib/schema-org";
import { buildPageMetadata } from "@/lib/seo-page";
import { getRequestSiteOrigin } from "@/lib/request-site-origin";
import { getRequestSiteDomain } from "@/lib/site-domain";
import {
  getNewsClusterMeta,
  inferNewsClusterFromText,
} from "@/lib/education-news/topic-clusters";
import { getToolExplainerMarkdown } from "@/lib/tool-explainer";

type Props = { searchParams: { page?: string | string[] } };

const DESC =
  "Education news on RankFlowHQ—clear coverage on exams, boards, and higher education updates. Browse all stories under /news.";

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const page = parseListPageParam(searchParams?.page);
  const titleBase = "Education News Articles — Latest Updates";
  const title = page > 1 ? `${titleBase} (page ${page})` : titleBase;
  const path = page > 1 ? `/news?page=${page}` : "/news";
  const siteOrigin = await getRequestSiteOrigin();
  return {
    ...buildPageMetadata({
      title,
      description: DESC,
      path,
      siteOrigin,
      keywords: [
        "education news articles",
        "education news updates",
        "exam updates",
        "India education news",
      ],
    }),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export const dynamic = "force-dynamic";

export default async function NewsIndexPage({ searchParams }: Props) {
  const siteDomain = await getRequestSiteDomain();
  const siteOrigin = await getRequestSiteOrigin();
  const markdown = await getToolExplainerMarkdown("news");
  const requestedPage = parseListPageParam(searchParams?.page);
  let items: Awaited<
    ReturnType<typeof listReadyRepurposedNewsPage>
  >["items"] = [];
  let total = 0;
  let loadFailed = false;

  try {
    const result = await listReadyRepurposedNewsPage(
      requestedPage,
      LIST_PAGE_SIZE,
      siteDomain,
    );
    items = result.items;
    total = result.total;
  } catch (e) {
    console.error("[news] list error:", e);
    loadFailed = true;
  }

  const totalPages =
    total === 0 ? 0 : Math.ceil(total / LIST_PAGE_SIZE);
  const currentPage =
    totalPages === 0
      ? 1
      : Math.min(Math.max(1, requestedPage), totalPages);

  if (!loadFailed && total > 0 && requestedPage > totalPages) {
    redirect(totalPages <= 1 ? "/news" : `/news?page=${totalPages}`);
  }
  if (!loadFailed && total === 0 && requestedPage > 1) {
    redirect("/news");
  }

  const positionStart =
    total > 0 ? (currentPage - 1) * LIST_PAGE_SIZE + 1 : 1;

  const schema = buildNewsIndexSchema({
    description: DESC,
    items: items.map((it) => ({ title: it.title, slug: it.slug })),
    itemPositionStart: positionStart,
    base: siteOrigin,
  });

  return (
    <>
      <JsonLd data={schema} />
      <main className="mx-auto min-w-0 max-w-3xl px-4 py-8 sm:py-10 md:px-6">
        <p className="font-mono text-xs">
          <Link
            href="/"
            className="text-text-muted transition-colors hover:text-accent"
          >
            ← Home
          </Link>
        </p>
        <header className="mt-6 rounded-2xl border border-border bg-surface/60 px-5 py-6 sm:px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            Education News
          </p>
          <h1 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            Latest stories
          </h1>
          <p className="mt-2 max-w-2xl font-serif text-sm text-text-secondary">
            SEO-ready coverage of education updates, optimized for readability and
            search intent.
          </p>
          <p className="mt-3 font-mono text-xs">
            <Link href="/news/category" className="text-accent hover:underline">
              Browse topical clusters (SSC, RRB, UPSC, Board Results) →
            </Link>
          </p>
        </header>

        {loadFailed ? (
          <p
            className="mt-10 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 font-serif text-sm text-amber-100"
            role="alert"
          >
            Could not load news right now. Try refreshing in a moment.
          </p>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-xl border border-border bg-surface/40 p-5">
            <p className="font-serif text-sm text-text-muted">
              No published articles yet. Run{" "}
              <Link href="/education-news" className="text-accent underline">
                Publish
              </Link>{" "}
              from the education news dashboard.
            </p>
          </div>
        ) : (
          <>
            <ul className="mt-8 grid gap-4">
              {items.map((item) => (
                <li key={item.id}>
                  {(() => {
                    const clusterId = inferNewsClusterFromText(item.title, item.source);
                    const cluster = clusterId ? getNewsClusterMeta(clusterId) : null;
                    return (
                  <Link
                    href={`/news/${encodeURIComponent(item.slug)}`}
                    className="group block rounded-xl border border-border bg-surface/50 p-4 transition-colors hover:border-accent/40 hover:bg-surface/70"
                  >
                    <span className="font-display text-xl text-text-primary group-hover:text-accent">
                      {item.title}
                    </span>
                    <span className="mt-2 inline-flex items-center gap-2">
                      <span className="inline-block rounded-full border border-border/80 bg-background/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-text-muted">
                        News Article
                      </span>
                      {cluster ? (
                        <span className="inline-block rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-accent">
                          {cluster.label}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-3 block font-mono text-[11px] leading-relaxed text-text-muted">
                      {(() => {
                        const issued = formatSourceIssueTimeIst(item.lastmod);
                        const published =
                          item.repurposedAt.toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          });
                        return issued
                          ? `Issued ${issued} · Published ${published}`
                          : `Published ${published}`;
                      })()}
                    </span>
                    <span className="mt-3 inline-block font-mono text-xs text-accent">
                      Read story →
                    </span>
                    {cluster ? (
                      <span className="mt-1 block font-mono text-[11px] text-text-muted">
                        Cluster hub:{" "}
                        <span className="text-accent">{cluster.path}</span>
                      </span>
                    ) : null}
                  </Link>
                    );
                  })()}
                </li>
              ))}
            </ul>
            {totalPages > 0 ? (
              <ListPagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath="/news"
              />
            ) : null}
          </>
        )}
      </main>
      <ToolExplainerSection markdown={markdown} />
    </>
  );
}
