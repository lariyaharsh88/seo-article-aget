-- Public URLs for repurposed drafts under /news/{slug}
ALTER TABLE "EducationNewsArticle" ADD COLUMN "repurposedSlug" TEXT;
ALTER TABLE "EducationNewsArticle" ADD COLUMN "repurposedCanonicalUrl" TEXT;

CREATE UNIQUE INDEX "EducationNewsArticle_repurposedSlug_key" ON "EducationNewsArticle"("repurposedSlug");

-- RLS was enabled with no policies; connections that are not the table owner (common with poolers)
-- get denied on all operations. This table is only accessed via Prisma on the server.
ALTER TABLE "EducationNewsArticle" DISABLE ROW LEVEL SECURITY;
