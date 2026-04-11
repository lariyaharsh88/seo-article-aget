import { PrismaClient } from "@prisma/client";
import { getEffectiveDatabaseUrl } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const effectiveUrl = getEffectiveDatabaseUrl();

/**
 * Dev: cache on `globalThis` so Next.js HMR does not spawn many Prisma clients.
 * Prod: rely on the module singleton (one client per serverless instance); Prisma’s
 * own guidance often avoids writing to `globalThis` in production to reduce odd
 * pooler / warm-instance edge cases with some hosts.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(effectiveUrl
      ? { datasources: { db: { url: effectiveUrl } } }
      : {}),
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
