-- AlterTable
ALTER TABLE "UserGeneratedArticle" ADD COLUMN "projectId" TEXT;

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "siteUrl" TEXT,
    "brandVoice" TEXT NOT NULL DEFAULT '',
    "audience" TEXT,
    "knowledgeBase" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishConnection" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "credentialsEnc" TEXT NOT NULL,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_supabaseUserId_idx" ON "Project"("supabaseUserId");

-- CreateIndex
CREATE INDEX "PublishConnection_supabaseUserId_idx" ON "PublishConnection"("supabaseUserId");
