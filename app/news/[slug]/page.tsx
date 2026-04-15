import { SiteDomain, type EducationNewsArticle } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { markdownToArticleBodyHtml } from "@/lib/markdown-to-html";
import {
  ArticleLeadCapture,
  ArticleLeadCtaStrip,
} from "@/components/ArticleLeadCapture";
import { ContentInterlinks } from "@/components/ContentInterlinks";
import { DEFAULT_ARTICLE_AUTHOR_NAME } from "@/lib/article-author";
import { NewsArticleTransientFailure } from "@/components/education-news/NewsArticleTransientFailure";
import { JsonLd } from "@/components/JsonLd";
import { formatSourceIssueTimeIst } from "@/lib/education-news/format-source-issue-time";
import {
  findReadyRepurposedNewsBySlug,
  listReadyRepurposedNewsExceptSlug,
  normalizeNewsSlugParam,
} from "@/lib/education-news/repurposed-news-query";
import { getRequestSiteOrigin } from "@/lib/request-site-origin";
import { buildRepurposedNewsArticleSchema } from "@/lib/schema-org";
import { SITE_NAME } from "@/lib/seo-site";
import { buildEducationFunnelUrl } from "@/lib/education-funnel-url";
import { buildPageMetadata } from "@/lib/seo-page";
import { permanentRedirectIfWrongSiteDomain } from "@/lib/site-domain-redirect";

type Props = { params: { slug: string } };

export const dynamic = "force-dynamic";

function buildNewsMetaDescription(title: string): string {
  const clean = title.replace(/\s+/g, " ").trim();
  const suffix =
    " LIVE today: result, admit card, exam date, direct link and PDF download details.";
  const full = `${clean}${suffix}`;
  return full.length <= 160 ? full : full.slice(0, 157).trimEnd() + "...";
}

function extractFaqsFromMarkdown(markdown: string): Array<{
  question: string;
  answer: string;
}> {
  const lines = markdown.split(/\r?\n/);
  const out: Array<{ question: string; answer: string }> = [];
  let inFaq = false;
  let currentQ: string | null = null;
  let currentA: string[] = [];

  const flush = () => {
    if (!currentQ) return;
    const answer = currentA.join(" ").replace(/\s+/g, " ").trim();
    if (answer) {
      out.push({ question: currentQ, answer });
    }
    currentQ = null;
    currentA = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!inFaq) {
      if (/^##\s+.*(faq|frequently asked questions)/i.test(line)) {
        inFaq = true;
      }
      continue;
    }

    if (/^##\s+/.test(line) && !/^##\s+.*(faq|frequently asked questions)/i.test(line)) {
      break;
    }

    if (/^###\s+/.test(line)) {
      flush();
      currentQ = line.replace(/^###\s+/, "").trim();
      continue;
    }

    if (!currentQ) continue;
    if (!line) continue;
    currentA.push(line.replace(/^[-*]\s+/, ""));
  }
  flush();

  return out.slice(0, 5);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let title = "News article";
  let description = SITE_NAME;
  let article:
    | { publishedTime: string; modifiedTime: string }
    | undefined;
  let ogImage: string | null | undefined;
  const slug = normalizeNewsSlugParam(params.slug);
  try {
    const post = await findReadyRepurposedNewsBySlug(slug);
    if (post?.repurposedSlug?.trim()) {
      await permanentRedirectIfWrongSiteDomain(
        SiteDomain.education,
        `/news/${params.slug}`,
      );
      title = post.title;
      description = buildNewsMetaDescription(post.title);
      ogImage = post.repurposedImageUrl?.trim() || undefined;
      if (post.repurposedAt) {
        article = {
          publishedTime: post.repurposedAt.toISOString(),
          modifiedTime: post.updatedAt.toISOString(),
        };
      }
    }
  } catch {
    /* DB unavailable */
  }
  const siteOrigin = await getRequestSiteOrigin();
  return {
    ...buildPageMetadata({
      title,
      description,
      path: `/news/${params.slug}`,
      article,
      ogImage,
      siteOrigin,
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

export default async function RepurposedNewsArticlePage({ params }: Props) {
  noStore();
  const slugParam = normalizeNewsSlugParam(params.slug);
  let post: EducationNewsArticle | null = null;
  let dbLoadFailed = false;
  try {
    post = await findReadyRepurposedNewsBySlug(params.slug);
  } catch (err) {
    console.error("[news/[slug]] database error:", err);
    dbLoadFailed = true;
  }

  if (dbLoadFailed) {
    return <NewsArticleTransientFailure slug={slugParam} />;
  }

  if (!post?.repurposedSlug?.trim() || !post.repurposedMarkdown?.trim()) {
    notFound();
  }

  await permanentRedirectIfWrongSiteDomain(
    SiteDomain.education,
    `/news/${params.slug}`,
  );

  const currentSlug = post.repurposedSlug.trim();
  const siteOrigin = await getRequestSiteOrigin();
  let peerNews: Awaited<ReturnType<typeof listReadyRepurposedNewsExceptSlug>> = [];
  try {
    peerNews = await listReadyRepurposedNewsExceptSlug(
      currentSlug,
      6,
      post.siteDomain,
    );
  } catch (e) {
    console.error("[news/[slug]] peer articles:", e);
  }

  let html: string;
  try {
    html = markdownToArticleBodyHtml(post.repurposedMarkdown);
  } catch (parseErr) {
    console.error("[news/[slug]] markdown parse error:", parseErr);
    html =
      '<p class="text-text-muted">This article could not be rendered. Try again later.</p>';
  }

  const issuedDisplay = formatSourceIssueTimeIst(post.lastmod);
  const issuedParsedMs = Date.parse(post.lastmod.trim());
  const issuedIso =
    !Number.isNaN(issuedParsedMs)
      ? new Date(issuedParsedMs).toISOString()
      : undefined;

  const faqEntries = extractFaqsFromMarkdown(post.repurposedMarkdown);

  const funnelSeoAgent = buildEducationFunnelUrl(
    "/seo-agent",
    "inline_article",
    currentSlug,
  );
  const funnelFooter = buildEducationFunnelUrl(
    "/seo-agent",
    "article_footer",
    currentSlug,
  );

  return (
    <>
      <JsonLd
        data={buildRepurposedNewsArticleSchema(post, {
          base: siteOrigin,
          faqs: faqEntries,
        })}
      />
      <main className="mx-auto min-w-0 max-w-3xl px-4 py-8 sm:py-10 md:px-6">
        <p className="font-mono text-xs">
          <Link
            href="/news"
            className="text-text-muted transition-colors hover:text-accent"
          >
            ← All news
          </Link>
        </p>
        <article className="mt-6">
          <p className="font-mono text-xs leading-relaxed text-text-muted">
            {issuedDisplay ? (
              <>
                <span className="text-text-secondary">
                  Issued <time dateTime={issuedIso}>{issuedDisplay}</time>
                </span>
                <span className="mx-2 text-text-muted/60">·</span>
              </>
            ) : null}
            <span className="text-text-secondary">
              By {post.authorName?.trim() || DEFAULT_ARTICLE_AUTHOR_NAME}
            </span>
            {post.repurposedAt ? (
              <>
                {" · "}
                <span className="text-text-secondary">Repurposed</span>{" "}
                <time dateTime={post.repurposedAt.toISOString()}>
                  {post.repurposedAt.toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}{" "}
                  IST
                </time>
              </>
            ) : null}
          </p>
          <h1 className="mt-3 font-display text-3xl text-text-primary sm:text-4xl md:text-5xl">
            {post.title}
          </h1>
          {post.repurposedImageUrl?.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element -- Blob/CDN hostnames vary; next/image can throw if host not allowlisted
            <img
              src={post.repurposedImageUrl.trim()}
              alt={post.title}
              width={1200}
              height={630}
              className="mt-6 h-auto w-full max-w-full rounded-xl border border-border object-cover"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          ) : null}
          <p className="mt-4 font-mono text-[11px] text-text-muted">
            <a
              href={post.url}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-accent underline-offset-2 hover:underline"
            >
              View original source
            </a>
            {post.repurposedCanonicalUrl ? (
              <>
                {" · "}
                <a
                  href={post.repurposedCanonicalUrl}
                  className="text-text-muted underline-offset-2 hover:text-accent hover:underline"
                >
                  Permalink (canonical)
                </a>
              </>
            ) : null}
          </p>
          <ArticleLeadCtaStrip className="mt-4" />
          <section className="mt-6 rounded-2xl border border-accent/35 bg-accent/10 px-4 py-4 sm:px-5">
            <p className="font-serif text-sm leading-relaxed text-text-secondary">
              Turn this topic into a ranked blog →{" "}
              <Link
                href={funnelSeoAgent}
                className="font-mono text-accent underline-offset-2 transition-colors hover:underline"
              >
                Try RankFlowHQ
              </Link>
            </p>
          </section>
          <div
            className="blog-prose mt-10 overflow-x-auto font-serif text-text-primary"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <ArticleLeadCapture
            source="news"
            articleSlug={currentSlug}
            articleTitle={post.title}
          />
        </article>
        <ContentInterlinks
          headingId="more-news-articles"
          heading="More news"
          items={peerNews.map((n) => {
            const issued = formatSourceIssueTimeIst(n.lastmod);
            const repurposed = n.repurposedAt.toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
            const description = issued
              ? `Issued ${issued} · Repurposed ${repurposed}`
              : `Repurposed ${repurposed}`;
            return {
              href: `/news/${encodeURIComponent(n.slug)}`,
              title: n.title,
              description,
            };
          })}
          seeAllHref="/news"
          seeAllLabel="All news"
        />
        <section className="mt-8 rounded-2xl border border-accent/30 bg-accent/10 p-6">
          <h2 className="font-display text-2xl text-text-primary">
            Turn this topic into a ranked blog
          </h2>
          <p className="mt-2 font-serif text-sm text-text-secondary">
            Use RankFlowHQ on the main site to go from keyword and SERP intent
            to publish-ready content with metadata, structure, and optimization
            checks.
          </p>
          <Link
            href={funnelFooter}
            className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 font-mono text-sm text-background transition-opacity hover:opacity-90"
          >
            Try RankFlowHQ
          </Link>
          <div className="mt-5 border-t border-border/70 pt-4">
            <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              Related education articles
            </h3>
            <ul className="mt-3 space-y-2 font-serif text-sm text-text-secondary">
              {peerNews.slice(0, 3).map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/news/${encodeURIComponent(n.slug)}`}
                    className="text-accent hover:underline"
                  >
                    {n.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
