import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma, SiteDomain } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { BLOG_ADMIN_EMAIL } from "@/lib/blog-constants";
import { DEFAULT_ARTICLE_AUTHOR_NAME } from "@/lib/article-author";
import { ensureUniqueSlug, slugify } from "@/lib/blog-slug";
import { prisma } from "@/lib/prisma";
import { inferSiteDomainFromText } from "@/lib/site-domain-infer";
import { parseSiteDomainInput } from "@/lib/site-domain-parse";
import { notifyTelegramNewBlogPost } from "@/lib/telegram-channel";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientPrismaError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return ["P1001", "P1002", "P1017", "P2024"].includes(err.code);
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  return false;
}

function isAuthorized(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === BLOG_ADMIN_EMAIL;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAuthorized(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const posts = await prisma.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const adminEmail = session?.user?.email?.trim().toLowerCase();
  if (!isAuthorized(adminEmail)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    published?: boolean;
    authorName?: string;
    /** Optional: `main` or `education`; otherwise inferred from title/excerpt/content. */
    siteDomain?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (title.length < 2) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (content.length < 10) {
    return NextResponse.json(
      { error: "content must be at least 10 characters" },
      { status: 400 },
    );
  }

  const baseSlug = body.slug?.trim()
    ? slugify(body.slug.trim())
    : slugify(title);

  const excerpt =
    typeof body.excerpt === "string" && body.excerpt.trim()
      ? body.excerpt.trim()
      : null;

  const authorName =
    typeof body.authorName === "string" && body.authorName.trim()
      ? body.authorName.trim().slice(0, 120)
      : DEFAULT_ARTICLE_AUTHOR_NAME;

  const resolvedSiteDomain =
    parseSiteDomainInput(body.siteDomain) ??
    inferSiteDomainFromText(title, excerpt, content);

  let slug = await ensureUniqueSlug(baseSlug);
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const post = await (async () => {
        const maxDb = 4;
        for (let dbTry = 0; dbTry < maxDb; dbTry++) {
          try {
            return await prisma.blogPost.create({
              data: {
                slug,
                title,
                excerpt,
                content,
                published: Boolean(body.published),
                siteDomain: resolvedSiteDomain,
                authorEmail: adminEmail!,
                authorName,
              },
            });
          } catch (e) {
            if (
              dbTry < maxDb - 1 &&
              isTransientPrismaError(e)
            ) {
              await sleep(120 * (dbTry + 1));
              continue;
            }
            throw e;
          }
        }
        throw new Error("createBlogPost: unreachable");
      })();
      revalidatePath("/blogs");
      revalidatePath("/blogs/sitemap.xml");
      revalidatePath(`/blogs/${post.slug}`);
      revalidateTag("blog-posts");
      if (post.published) {
        notifyTelegramNewBlogPost({
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          slug: post.slug,
        });
      }
      return NextResponse.json(post);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        attempt < 7
      ) {
        slug = await ensureUniqueSlug(baseSlug);
        continue;
      }
      throw e;
    }
  }
  return NextResponse.json(
    { error: "Could not create post (slug conflict). Try again." },
    { status: 500 },
  );
}
