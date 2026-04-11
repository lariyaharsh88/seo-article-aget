import { prisma } from "@/lib/prisma";

export function slugify(title: string): string {
  const s = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return s || "post";
}

export async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 0;
  while (true) {
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}
