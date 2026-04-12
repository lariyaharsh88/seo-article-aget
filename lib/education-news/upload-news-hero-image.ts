import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getImagesCdnBase } from "@/lib/images-cdn";
import { getNewsHeroImageBuffer } from "@/lib/education-news/news-hero-og";

/**
 * Renders a 1200×630 hero PNG, uploads to Vercel Blob at `news/{slug}.png`,
 * saves public URL on the row (`repurposedImageUrl`). Requires `BLOB_READ_WRITE_TOKEN`.
 * If `IMAGES_CDN_BASE` is set (e.g. https://images.rankflowhq.com), the stored URL uses
 * that host + the Blob pathname so it matches your CDN custom domain.
 */
export async function createAndStoreNewsHeroImage(opts: {
  articleId: string;
  slug: string;
  title: string;
  /** Optional; also see NEWS_FEATURED_EXAM_LOGO_URL in env. */
  examLogoUrl?: string | null;
}): Promise<string | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return null;
  }

  try {
    const pathname = `news/${opts.slug}.png`;
    const buf = await getNewsHeroImageBuffer({
      title: opts.title,
      examLogoUrl: opts.examLogoUrl,
    });

    const blob = await put(pathname, buf, {
      access: "public",
      token,
      addRandomSuffix: false,
      contentType: "image/png",
    });

    let publicUrl = blob.url;
    const cdnBase = getImagesCdnBase();
    if (cdnBase) {
      try {
        const u = new URL(blob.url);
        publicUrl = `${cdnBase}${u.pathname}${u.search || ""}`;
      } catch {
        /* keep blob.url */
      }
    }

    await prisma.educationNewsArticle.update({
      where: { id: opts.articleId },
      data: { repurposedImageUrl: publicUrl },
    });

    return publicUrl;
  } catch (e) {
    console.error("[news-image] create/upload failed:", e);
    return null;
  }
}
