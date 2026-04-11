/**
 * Ensures Prisma can load schema (requires DATABASE_URL + DIRECT_URL) during postinstall
 * when env files are not present yet.
 */
import { execSync } from "node:child_process";

const fallback =
  "postgresql://prisma:prisma@127.0.0.1:5432/prisma_placeholder";

process.env.DATABASE_URL = process.env.DATABASE_URL?.trim() || fallback;
process.env.DIRECT_URL = process.env.DIRECT_URL?.trim() || fallback;

execSync("npx prisma generate", { stdio: "inherit", env: process.env });
