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
import { getToolExplainerMarkdown } from "@/lib/tool-explainer";

type Props = { searchParams: { page?: string | string[] } };

const DESC =
  "Repurposed education news on RankFlowHQ—SEO-friendly articles on exams, boards, and higher ed. Browse the index and open full stories under /news.";

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const page = parseListPageParam(searchParams?.page);
  const titleBase = "Education News Articles — Repurposed SEO Stories";
  const title = page > 1 ? `${titleBase} (page ${page})` : titleBase;
  const path = page > 1 ? `/news?page=${page}` : "/news";
  return buildPageMetadata({
    title,
    description: DESC,
    path,
    keywords: [
      "education news articles",
      "repurposed news SEO",
      "exam updates",
      "India education news",
    ],
  });
}

export const dynamic = "force-dynamic";

export default async function NewsIndexPage({ searchParams }: Props) {
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
        <h1 className="mt-6 font-display text-3xl text-text-primary sm:text-4xl">
          News
        </h1>

        {loadFailed ? (
          <p className="mt-10 font-serif text-sm text-amber-100" role="alert">
            Could not load news right now. Try refreshing in a moment.
          </p>
        ) : items.length === 0 ? (
          <p className="mt-10 font-serif text-sm text-text-muted">
            No published repurposed articles yet. Run{" "}
            <Link href="/education-news" className="text-accent underline">
              Repurpose
            </Link>{" "}
            from the education news dashboard.
          </p>
        ) : (
          <>
            <ul className="mt-10 space-y-4 border-t border-border pt-8">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="border-b border-border/80 pb-4 last:border-0"
                >
                  <Link
                    href={`/news/${encodeURIComponent(item.slug)}`}
                    className="group block"
                  >
                    <span className="font-display text-lg text-text-primary group-hover:text-accent">
                      {item.title}
                    </span>
                    <span className="mt-1 block font-mono text-[11px] leading-relaxed text-text-muted">
                      {(() => {
                        const issued = formatSourceIssueTimeIst(item.lastmod);
                        const repurposed =
                          item.repurposedAt.toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          });
                        return issued
                          ? `Issued ${issued} · Repurposed ${repurposed}`
                          : `Repurposed ${repurposed}`;
                      })()}
                    </span>
                  </Link>
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
