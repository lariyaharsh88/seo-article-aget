-- Internal linking engine: keywords, embedding cache, suggested edges

CREATE TYPE "KeywordRole" AS ENUM ('primary', 'secondary', 'supporting');

CREATE TYPE "InternalLinkKind" AS ENUM ('same_cluster', 'supporting_keyword', 'parent_child', 'semantic');

CREATE TABLE "ArticleKeyword" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "role" "KeywordRole" NOT NULL DEFAULT 'secondary',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleKeyword_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ArticleKeyword_articleId_idx" ON "ArticleKeyword"("articleId");
CREATE INDEX "ArticleKeyword_phrase_idx" ON "ArticleKeyword"("phrase");

ALTER TABLE "ArticleKeyword" ADD CONSTRAINT "ArticleKeyword_articleId_fkey"
  FOREIGN KEY ("articleId") REFERENCES "UserGeneratedArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ArticleEmbedding" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "vector" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleEmbedding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ArticleEmbedding_articleId_key" ON "ArticleEmbedding"("articleId");

ALTER TABLE "ArticleEmbedding" ADD CONSTRAINT "ArticleEmbedding_articleId_fkey"
  FOREIGN KEY ("articleId") REFERENCES "UserGeneratedArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "InternalLinkSuggestion" (
    "id" TEXT NOT NULL,
    "fromArticleId" TEXT NOT NULL,
    "toArticleId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "anchorText" TEXT NOT NULL,
    "kind" "InternalLinkKind" NOT NULL,
    "rationale" TEXT,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "InternalLinkSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InternalLinkSuggestion_fromArticleId_toArticleId_key"
  ON "InternalLinkSuggestion"("fromArticleId", "toArticleId");

CREATE INDEX "InternalLinkSuggestion_fromArticleId_idx" ON "InternalLinkSuggestion"("fromArticleId");
CREATE INDEX "InternalLinkSuggestion_toArticleId_idx" ON "InternalLinkSuggestion"("toArticleId");

ALTER TABLE "InternalLinkSuggestion" ADD CONSTRAINT "InternalLinkSuggestion_fromArticleId_fkey"
  FOREIGN KEY ("fromArticleId") REFERENCES "UserGeneratedArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InternalLinkSuggestion" ADD CONSTRAINT "InternalLinkSuggestion_toArticleId_fkey"
  FOREIGN KEY ("toArticleId") REFERENCES "UserGeneratedArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
