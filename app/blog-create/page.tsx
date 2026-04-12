import type { BlogPost } from "@prisma/client";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { BlogCreateClient } from "@/components/blog/BlogCreateClient";
import { authOptions } from "@/lib/auth-options";
import { BLOG_ADMIN_EMAIL } from "@/lib/blog-constants";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata } from "@/lib/seo-page";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Blog CMS — Admin Article Generator",
    description:
      "Password-protected RankFlowHQ blog admin: run the article pipeline from one or many topics, review drafts, and publish posts (noindex; for authorized editors only).",
    path: "/blog-create",
    keywords: ["blog admin", "RankFlowHQ CMS"],
  }),
  robots: { index: false, follow: false },
};

export default async function BlogCreatePage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email || email !== BLOG_ADMIN_EMAIL) {
    redirect("/auth/signin?callbackUrl=/blog-create");
  }

  let posts: BlogPost[] = [];
  let loadError: string | null = null;
  try {
    posts = await prisma.blogPost.findMany({
      orderBy: { updatedAt: "desc" },
    });
  } catch (err) {
    console.error("[blog-create] prisma.blogPost.findMany failed:", err);
    loadError =
      "Could not load posts from the database. On the host, set DATABASE_URL (and DIRECT_URL for migrations), run Prisma migrations against that database, then redeploy.";
  }

  return <BlogCreateClient initialPosts={posts} loadError={loadError} />;
}
