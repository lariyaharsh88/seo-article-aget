import { SiteDomain } from "@prisma/client";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

type HomeLinkItem = {
  title: string;
  href: string;
  updatedAt: Date;
};

export async function RecentTrendingSection() {
  let recentPosts: HomeLinkItem[] = [];
  let trending: HomeLinkItem[] = [];

  try {
    const [newsRows, blogRows, articleRows] = await Promise.all([
      prisma.educationNewsArticle.findMany({
        where: {
          repurposeStatus: "ready",
          repurposedSlug: { not: null },
          siteDomain: SiteDomain.education,
        },
        select: { title: true, repurposedSlug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.blogPost.findMany({
        where: {
          published: true,
          siteDomain: SiteDomain.main,
        },
        select: { title: true, slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.sharedArticle.findMany({
        where: { siteDomain: SiteDomain.main },
        select: { title: true, slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
    ]);

    const merged: HomeLinkItem[] = [
      ...newsRows
        .filter((r) => Boolean(r.repurposedSlug?.trim()))
        .map((r) => ({
          title: r.title,
          href: `/news/${encodeURIComponent((r.repurposedSlug as string).trim())}`,
          updatedAt: r.updatedAt,
        })),
      ...blogRows.map((r) => ({
        title: r.title,
        href: `/blog/${encodeURIComponent(r.slug)}`,
        updatedAt: r.updatedAt,
      })),
      ...articleRows.map((r) => ({
        title: r.title,
        href: `/article/${encodeURIComponent(r.slug)}`,
        updatedAt: r.updatedAt,
      })),
    ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    recentPosts = merged.slice(0, 8);

    const now = Date.now();
    const windowMs = 72 * 60 * 60 * 1000;
    trending = merged
      .filter((x) => now - x.updatedAt.getTime() <= windowMs)
      .slice(0, 6);
  } catch (e) {
    console.error("[home] recent/trending query failed:", e);
  }

  return (
    <section className="reveal-on-scroll section-lazy mt-14 grid gap-4 md:gap-6 lg:grid-cols-2 md:mt-20">
      <div className="card-premium rounded-2xl border border-border/80 bg-surface/50 p-6">
        <h2 className="font-display text-2xl text-text-primary">Recent posts</h2>
        <p className="mt-1 font-serif text-sm text-text-secondary">
          Fresh content from your ecosystem to strengthen internal linking.
        </p>
        <ul className="mt-4 space-y-2">
          {recentPosts.length > 0 ? (
            recentPosts.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="font-serif text-sm text-accent hover:underline">
                  {p.title}
                </Link>
              </li>
            ))
          ) : (
            <li className="rounded-lg border border-border/70 bg-background/40 px-3 py-2 font-serif text-sm text-text-muted">
              No recent posts yet.
              <Link href="/seo-agent" className="ml-1 font-mono text-xs text-accent hover:underline">
                Get your first SEO article live →
              </Link>
            </li>
          )}
        </ul>
      </div>
      <div className="card-premium rounded-2xl border border-border/80 bg-surface/50 p-6">
        <h2 className="font-display text-2xl text-text-primary">Trending now</h2>
        <p className="mt-1 font-serif text-sm text-text-secondary">
          Fast-moving topics to capture fresh demand before competitors.
        </p>
        <ul className="mt-4 space-y-2">
          {trending.length > 0 ? (
            trending.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="font-serif text-sm text-accent hover:underline">
                  {p.title}
                </Link>
              </li>
            ))
          ) : (
            <li className="rounded-lg border border-border/70 bg-background/40 px-3 py-2 font-serif text-sm text-text-muted">
              No trending signals yet.
              <Link href="/free-tools" className="ml-1 font-mono text-xs text-accent hover:underline">
                Find your next traffic topic →
              </Link>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
