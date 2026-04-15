-- CreateEnum
CREATE TYPE "SiteDomain" AS ENUM ('main', 'education');

-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN "siteDomain" "SiteDomain" NOT NULL DEFAULT 'main';

-- AlterTable
ALTER TABLE "SharedArticle" ADD COLUMN "siteDomain" "SiteDomain" NOT NULL DEFAULT 'main';

-- AlterTable
ALTER TABLE "EducationNewsArticle" ADD COLUMN "siteDomain" "SiteDomain" NOT NULL DEFAULT 'education';
