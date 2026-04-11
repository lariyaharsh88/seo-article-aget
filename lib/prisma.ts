import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/**
 * Single PrismaClient per runtime (dev HMR + serverless warm invocations).
 * Without `globalThis` in production, cold/warm churn can exhaust DB connections
 * or surface flaky "unreachable" errors on Vercel.
 */
export const prisma =
  globalForPrisma.prisma ??
  (globalForPrisma.prisma = new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  }));
