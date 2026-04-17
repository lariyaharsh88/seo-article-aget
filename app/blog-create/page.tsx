import type { BlogPost } from "@prisma/client";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { BlogCreateClient } from "@/components/blog/BlogCreateClient";
import { BlogCreateFromTopics } from "@/components/education-blog/BlogCreateFromTopics";
import { authOptions } from "@/lib/auth-options";
import { BLOG_ADMIN_EMAIL } from "@/lib/blog-constants";
import { EDUCATION_HOSTS } from "@/lib/education-hosts";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata } from "@/lib/seo-page";

export async function generateMetadata(): Promise<Metadata> {
  const host = headers().get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (EDUCATION_HOSTS.has(host)) {
    return {
      ...buildPageMetadata({
        title: "Blog — Create drafts from topics",
        description:
          "Education subdomain: bulk-create unpublished blog post drafts from comma-separated topics (authorized editors only).",
        path: "/blog-create",
        keywords: ["education blog", "blog drafts", "RankFlowHQ"],
      }),
      robots: { index: false, follow: false },
    };
  }
  return {
    ...buildPageMetadata({
      title: "Blog CMS — Admin Article Generator",
      description:
        "Password-protected RankFlowHQ blog admin: run the article pipeline from one or many topics, review drafts, and publish posts (noindex; for authorized editors only).",
      path: "/blog-create",
      keywords: ["blog admin", "RankFlowHQ CMS"],
    }),
    robots: { index: false, follow: false },
  };
}

export default async function BlogCreatePage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email || email !== BLOG_ADMIN_EMAIL) {
    redirect("/auth/signin?callbackUrl=/blog-create");
  }

  const host = headers().get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (EDUCATION_HOSTS.has(host)) {
    return <BlogCreateFromTopics />;
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
