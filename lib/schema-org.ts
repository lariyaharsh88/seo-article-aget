import type { BlogPost, EducationNewsArticle } from "@prisma/client";
import { DEFAULT_ARTICLE_AUTHOR_NAME } from "@/lib/article-author";
import { SITE_DESCRIPTION, SITE_LOGO_PATH, SITE_NAME } from "@/lib/seo-site";
import { getSiteUrl } from "@/lib/site-url";

export function siteRefs() {
  const base = getSiteUrl().replace(/\/$/, "");
  return siteRefsForOrigin(base);
}

function siteRefsForOrigin(base: string) {
  const b = base.replace(/\/$/, "");
  return {
    base: b,
    websiteId: `${b}/#website`,
    orgId: `${b}/#organization`,
    softwareId: `${b}/#software`,
  };
}

/** Home (/) — WebPage + ItemList of main tools. */
export function buildHomePageSchema(): Record<string, unknown> {
  const { base, websiteId, orgId } = siteRefs();
  const tools: { name: string; path: string }[] = [
    { name: "Blog", path: "/blogs" },
    { name: "SEO article pipeline", path: "/seo-agent" },
    { name: "Repurpose from URL", path: "/repurpose-url" },
    { name: "AI SEO Toolkit", path: "/ai-seo-toolkit" },
    { name: "Off-page SEO & outreach", path: "/off-page-seo" },
    { name: "Education Google Trends", path: "/education-trends" },
    { name: "Education news digest", path: "/education-news" },
    { name: "News", path: "/news" },
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${base}/#webpage`,
        url: base,
        name: `${SITE_NAME} — SEO tools hub`,
        description: SITE_DESCRIPTION,
        isPartOf: { "@id": websiteId },
        about: { "@id": orgId },
      },
      {
        "@type": "ItemList",
        "@id": `${base}/#tools-itemlist`,
        name: `${SITE_NAME} tools`,
        numberOfItems: tools.length,
        itemListElement: tools.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.name,
          url: `${base}${t.path}`,
        })),
      },
    ],
  };
}

/** /blogs — CollectionPage + breadcrumbs. */
export function buildBlogsIndexSchema(opts?: {
  /** e.g. education subdomain origin when serving `/blogs` there */
  base?: string;
}): Record<string, unknown> {
  return buildCollectionPageSchema({
    path: "/blogs",
    headline: "Articles",
    description:
      "Notes on SEO tooling, content workflows, and product updates from RankFlowHQ.",
    breadcrumb: [
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blogs" },
    ],
    base: opts?.base,
  });
}

export function buildCollectionPageSchema(opts: {
  path: string;
  headline: string;
  description: string;
  breadcrumb: { name: string; path: string }[];
  base?: string;
}): Record<string, unknown> {
  const { base, websiteId, orgId } = opts.base
    ? siteRefsForOrigin(opts.base)
    : siteRefs();
  const url = `${base}${opts.path.startsWith("/") ? opts.path : `/${opts.path}`}`;
  const wpId = `${url}#webpage`;
  const bcId = `${url}#breadcrumb`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebPage", "CollectionPage"],
        "@id": wpId,
        url,
        name: opts.headline,
        description: opts.description,
        isPartOf: { "@id": websiteId },
        about: { "@id": orgId },
        breadcrumb: { "@id": bcId },
      },
      {
        "@type": "BreadcrumbList",
        "@id": bcId,
        itemListElement: opts.breadcrumb.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${base}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
        })),
      },
    ],
  };
}

/** Blog post — BlogPosting + WebPage + BreadcrumbList. */
export function buildBlogPostingSchema(
  post: BlogPost,
  opts?: { base?: string },
): Record<string, unknown> {
  const { base, websiteId, orgId } = opts?.base
    ? siteRefsForOrigin(opts.base)
    : siteRefs();
  const path = `/blogs/${post.slug}`;
  const url = `${base}${path}`;
  const wpId = `${url}#webpage`;
  const articleId = `${url}#article`;
  const bcId = `${url}#breadcrumb`;
  const desc = (post.excerpt?.trim() || post.title).slice(0, 500);

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": wpId,
      url,
      name: post.title,
      description: desc,
      isPartOf: { "@id": websiteId },
      breadcrumb: { "@id": bcId },
    },
    {
      "@type": "BreadcrumbList",
      "@id": bcId,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: base,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: `${base}/blogs`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: post.title,
          item: url,
        },
      ],
    },
    {
      "@type": "BlogPosting",
      "@id": articleId,
      headline: post.title,
      ...(post.excerpt?.trim() ? { description: post.excerpt.trim() } : {}),
      datePublished: post.createdAt.toISOString(),
      dateModified: post.updatedAt.toISOString(),
      author: {
        "@type": "Person",
        name: post.authorName?.trim() || DEFAULT_ARTICLE_AUTHOR_NAME,
      },
      publisher: { "@id": orgId },
      mainEntityOfPage: { "@id": wpId },
      url,
      inLanguage: "en",
    },
  ];

  return { "@context": "https://schema.org", "@graph": graph };
}

/** Repurposed education news — NewsArticle + WebPage + BreadcrumbList. */
export function buildRepurposedNewsArticleSchema(
  post: Pick<
    EducationNewsArticle,
    | "title"
    | "source"
    | "url"
    | "repurposedSlug"
    | "repurposedAt"
    | "updatedAt"
    | "repurposedImageUrl"
    | "authorName"
  >,
  opts?: {
    base?: string;
    faqs?: Array<{ question: string; answer: string }>;
  },
): Record<string, unknown> {
  const { base, websiteId, orgId } = opts?.base
    ? siteRefsForOrigin(opts.base)
    : siteRefs();
  const slug = post.repurposedSlug?.trim() ?? "";
  const path = `/news/${slug}`;
  const url = `${base}${path}`;
  const wpId = `${url}#webpage`;
  const articleId = `${url}#article`;
  const bcId = `${url}#breadcrumb`;
  const desc = post.title.slice(0, 500);
  const published = post.repurposedAt?.toISOString() ?? post.updatedAt.toISOString();
  const heroUrl = post.repurposedImageUrl?.trim();

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": wpId,
      url,
      name: post.title,
      description: desc,
      isPartOf: { "@id": websiteId },
      about: { "@id": orgId },
      breadcrumb: { "@id": bcId },
      mainEntity: { "@id": articleId },
      ...(heroUrl
        ? {
            primaryImageOfPage: {
              "@type": "ImageObject",
              url: heroUrl,
            },
          }
        : {}),
    },
    {
      "@type": "BreadcrumbList",
      "@id": bcId,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: base,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "News",
          item: `${base}/news`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: post.title,
          item: url,
        },
      ],
    },
    {
      "@type": "NewsArticle",
      "@id": articleId,
      headline: post.title,
      description: desc,
      datePublished: published,
      dateModified: post.updatedAt.toISOString(),
      author: {
        "@type": "Person",
        name: post.authorName?.trim() || DEFAULT_ARTICLE_AUTHOR_NAME,
      },
      publisher: {
        "@type": "Organization",
        "@id": orgId,
        name: SITE_NAME,
        logo: {
          "@type": "ImageObject",
          url: `${base}${SITE_LOGO_PATH}`,
        },
      },
      copyrightHolder: { "@id": orgId },
      genre: "Educational news",
      isAccessibleForFree: true,
      mainEntityOfPage: { "@id": wpId },
      url,
      inLanguage: "en",
      ...(heroUrl
        ? {
            image: [
              {
                "@type": "ImageObject",
                url: heroUrl,
                width: 1200,
                height: 630,
              },
            ],
          }
        : {}),
    },
  ];

  const faqs = opts?.faqs?.filter(
    (f) => f.question.trim().length > 0 && f.answer.trim().length > 0,
  );
  if (faqs && faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question.trim(),
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer.trim(),
        },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

/** `/news` index — CollectionPage + ItemList of article URLs + BreadcrumbList. */
export function buildNewsIndexSchema(opts: {
  description: string;
  items: Array<{ title: string; slug: string }>;
  /** First ListItem position on this page (e.g. `(page - 1) * pageSize + 1`). Default 1. */
  itemPositionStart?: number;
  /** Canonical origin when index is served on education vs main. */
  base?: string;
}): Record<string, unknown> {
  const { base, websiteId, orgId } = opts.base
    ? siteRefsForOrigin(opts.base)
    : siteRefs();
  const newsUrl = `${base}/news`;
  const wpId = `${newsUrl}#webpage`;
  const bcId = `${newsUrl}#breadcrumb`;
  const listId = `${newsUrl}#itemlist`;
  const start = opts.itemPositionStart ?? 1;

  const itemListElement = opts.items.map((it, i) => ({
    "@type": "ListItem",
    position: start + i,
    name: it.title,
    item: `${base}/news/${encodeURIComponent(it.slug)}`,
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebPage", "CollectionPage"],
        "@id": wpId,
        url: newsUrl,
        name: "News",
        description: opts.description,
        isPartOf: { "@id": websiteId },
        about: { "@id": orgId },
        breadcrumb: { "@id": bcId },
        mainEntity: { "@id": listId },
      },
      {
        "@type": "BreadcrumbList",
        "@id": bcId,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: base,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "News",
            item: newsUrl,
          },
        ],
      },
      {
        "@type": "ItemList",
        "@id": listId,
        name: "News articles",
        numberOfItems: opts.items.length,
        itemListElement,
      },
    ],
  };
}

type WebPageType = "WebPage" | "AboutPage";

/** Static/marketing pages: About, Privacy, Terms, etc. */
export function buildStaticWebPageSchema(opts: {
  path: string;
  name: string;
  description: string;
  pageType?: WebPageType;
  breadcrumb: { name: string; path: string }[];
}): Record<string, unknown> {
  const { base, websiteId, orgId } = siteRefs();
  const url = `${base}${opts.path.startsWith("/") ? opts.path : `/${opts.path}`}`;
  const wpId = `${url}#webpage`;
  const bcId = `${url}#breadcrumb`;
  const primaryType = opts.pageType ?? "WebPage";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": primaryType === "AboutPage" ? ["WebPage", "AboutPage"] : "WebPage",
        "@id": wpId,
        url,
        name: opts.name,
        description: opts.description,
        isPartOf: { "@id": websiteId },
        about: { "@id": orgId },
        breadcrumb: { "@id": bcId },
      },
      {
        "@type": "BreadcrumbList",
        "@id": bcId,
        itemListElement: opts.breadcrumb.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${base}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
        })),
      },
    ],
  };
}

/** Interactive tool routes — WebApplication + WebPage + BreadcrumbList. */
export function buildToolWebApplicationSchema(opts: {
  path: string;
  /** Short name for schema (e.g. "SEO article pipeline") */
  name: string;
  /** Page H1 / visible title */
  headline: string;
  description: string;
}): Record<string, unknown> {
  const { base, websiteId, orgId } = siteRefs();
  const url = `${base}${opts.path.startsWith("/") ? opts.path : `/${opts.path}`}`;
  const wpId = `${url}#webpage`;
  const appId = `${url}#webapplication`;
  const bcId = `${url}#breadcrumb`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": wpId,
        url,
        name: opts.headline,
        description: opts.description,
        isPartOf: { "@id": websiteId },
        breadcrumb: { "@id": bcId },
        mainEntity: { "@id": appId },
      },
      {
        "@type": "BreadcrumbList",
        "@id": bcId,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: base,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: opts.name,
            item: url,
          },
        ],
      },
      {
        "@type": "WebApplication",
        "@id": appId,
        name: opts.name,
        url,
        description: opts.description,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "SEO Software",
        operatingSystem: "Web",
        browserRequirements: "Requires JavaScript. Modern browser.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        provider: { "@id": orgId },
        isPartOf: { "@id": websiteId },
      },
    ],
  };
}
