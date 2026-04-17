import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { BLOG_ADMIN_EMAIL } from "@/lib/blog-constants";
import { CreateBlogFromTopics } from "@/components/main-blog/CreateBlogFromTopics";
import { buildPageMetadata } from "@/lib/seo-page";
import { SiteDomain, absoluteUrlForSiteDomain, getRequestSiteDomain } from "@/lib/site-domain";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Create Blog Drafts — Main Domain",
    description:
      "Create main-domain blog drafts in bulk from comma-separated topics (admin only).",
    path: "/create-blog",
    keywords: ["blog drafts", "main domain blog", "RankFlowHQ admin"],
  }),
  robots: { index: false, follow: false },
};

export default async function CreateBlogPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email || email !== BLOG_ADMIN_EMAIL) {
    redirect("/auth/signin?callbackUrl=/create-blog");
  }

  const requestDomain = await getRequestSiteDomain();
  if (requestDomain === SiteDomain.education) {
    redirect(absoluteUrlForSiteDomain(SiteDomain.main, "/create-blog"));
  }

  return <CreateBlogFromTopics />;
}
