CREATE TABLE "SharedArticle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "markdown" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedArticle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SharedArticle_slug_key" ON "SharedArticle"("slug");
CREATE INDEX "SharedArticle_createdAt_idx" ON "SharedArticle"("createdAt");
