CREATE TYPE "DistributionBatchStatus" AS ENUM ('draft', 'queued', 'processing', 'completed', 'partial_failure', 'failed');

CREATE TABLE "DistributionBatch" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT,
    "articleRef" TEXT,
    "canonicalUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "packJson" JSONB NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "status" "DistributionBatchStatus" NOT NULL DEFAULT 'queued',
    "resultJson" JSONB,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DistributionBatch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DistributionBatch_status_scheduledAt_idx" ON "DistributionBatch"("status", "scheduledAt");
CREATE INDEX "DistributionBatch_supabaseUserId_createdAt_idx" ON "DistributionBatch"("supabaseUserId", "createdAt");
