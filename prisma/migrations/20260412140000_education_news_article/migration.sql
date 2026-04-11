-- CreateTable
CREATE TABLE "EducationNewsArticle" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "lastmod" TEXT NOT NULL,
    "rawArticleText" TEXT,
    "rawFetchedAt" TIMESTAMP(3),
    "repurposedMarkdown" TEXT,
    "repurposedAt" TIMESTAMP(3),
    "repurposeStatus" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationNewsArticle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EducationNewsArticle_url_key" ON "EducationNewsArticle"("url");

ALTER TABLE "EducationNewsArticle" ENABLE ROW LEVEL SECURITY;
