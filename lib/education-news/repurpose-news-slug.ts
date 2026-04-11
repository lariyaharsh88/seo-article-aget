import { prisma } from "@/lib/prisma";

/** Unique slug among repurposed education news rows (nullable unique allows many unset). */
export async function ensureUniqueRepurposedSlug(
  base: string,
  excludeArticleId?: string,
): Promise<string> {
  let slug = base;
  let n = 0;
  for (;;) {
    const existing = await prisma.educationNewsArticle.findFirst({
      where: {
        repurposedSlug: slug,
        ...(excludeArticleId
          ? { NOT: { id: excludeArticleId } }
          : {}),
      },
      select: { id: true },
    });
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}
