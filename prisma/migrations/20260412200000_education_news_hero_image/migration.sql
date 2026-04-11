-- Public hero image URL (CDN / Vercel Blob) for news articles and sitemaps
ALTER TABLE "EducationNewsArticle" ADD COLUMN "repurposedImageUrl" TEXT;
