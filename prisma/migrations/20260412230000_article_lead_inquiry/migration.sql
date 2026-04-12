-- Leads from blog / news article pages (simple contact capture).
CREATE TABLE "LeadInquiry" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "articleSlug" TEXT NOT NULL,
    "articleTitle" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadInquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LeadInquiry_createdAt_idx" ON "LeadInquiry"("createdAt");
CREATE INDEX "LeadInquiry_source_articleSlug_idx" ON "LeadInquiry"("source", "articleSlug");
