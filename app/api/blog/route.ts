import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { BLOG_ADMIN_EMAIL } from "@/lib/blog-constants";
import { ensureUniqueSlug, slugify } from "@/lib/blog-slug";
import { prisma } from "@/lib/prisma";

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
  const slug = await ensureUniqueSlug(baseSlug);

  const excerpt =
    typeof body.excerpt === "string" && body.excerpt.trim()
      ? body.excerpt.trim()
      : null;

  const post = await prisma.blogPost.create({
    data: {
      slug,
      title,
      excerpt,
      content,
      published: Boolean(body.published),
      authorEmail: adminEmail!,
    },
  });

  return NextResponse.json(post);
}
