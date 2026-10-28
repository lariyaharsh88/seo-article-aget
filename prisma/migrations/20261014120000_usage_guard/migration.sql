-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE "UsageCounter" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsageCounter_subject_bucket_key" ON "UsageCounter"("subject", "bucket");

-- CreateIndex
CREATE INDEX "UsageCounter_updatedAt_idx" ON "UsageCounter"("updatedAt");
