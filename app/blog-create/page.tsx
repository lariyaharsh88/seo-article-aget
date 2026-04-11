import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { BlogCreateClient } from "@/components/blog/BlogCreateClient";
import { authOptions } from "@/lib/auth-options";
import { BLOG_ADMIN_EMAIL } from "@/lib/blog-constants";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata } from "@/lib/seo-page";

export const metadata = buildPageMetadata({
  title: "Blog CMS",
  description:
    "Run the full article generator from a topic, then publish to the blog (admin only).",
  path: "/blog-create",
});

export default async function BlogCreatePage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email || email !== BLOG_ADMIN_EMAIL) {
    redirect("/auth/signin?callbackUrl=/blog-create");
  }

  const posts = await prisma.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return <BlogCreateClient initialPosts={posts} />;
}
