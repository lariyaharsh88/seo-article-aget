CREATE TABLE "SeoFeedbackSnapshot" (
    "id" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeoFeedbackSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SeoFeedbackSnapshot_pageUrl_createdAt_idx" ON "SeoFeedbackSnapshot"("pageUrl", "createdAt");
