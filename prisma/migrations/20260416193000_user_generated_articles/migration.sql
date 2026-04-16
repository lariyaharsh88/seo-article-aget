CREATE TABLE "UserGeneratedArticle" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "primaryKeyword" TEXT,
    "sourceUrl" TEXT,
    "markdown" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGeneratedArticle_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserGeneratedArticle_supabaseUserId_createdAt_idx"
ON "UserGeneratedArticle"("supabaseUserId", "createdAt");

ALTER TABLE "UserGeneratedArticle" ENABLE ROW LEVEL SECURITY;
