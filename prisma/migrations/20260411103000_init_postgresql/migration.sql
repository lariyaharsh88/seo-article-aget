-- CreateTable
CREATE TABLE "VisibilityLog" (
    "id" SERIAL NOT NULL,
    "keyword" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "mentioned" BOOLEAN NOT NULL,
    "position" INTEGER,
    "responseText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisibilityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptQuery" (
    "id" SERIAL NOT NULL,
    "query" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizedContent" (
    "id" SERIAL NOT NULL,
    "keyword" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "optimizedContent" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OptimizedContent_pkey" PRIMARY KEY ("id")
);
