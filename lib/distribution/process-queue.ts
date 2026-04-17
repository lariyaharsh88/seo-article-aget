import type { DistributionBatchStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SocialDistributionPack } from "@/lib/distribution/social-copy";
import {
  postLinkedInArticle,
  postPinterestPin,
  postTwitterThread,
} from "@/lib/distribution/providers/social-post";

export async function processDueDistributionBatches(opts?: {
  /** Max batches per cron invocation */
  limit?: number;
}): Promise<{ processed: number; errors: string[] }> {
  const limit = opts?.limit ?? 5;
  const now = new Date();
  const errors: string[] = [];
  let processed = 0;

  const rows = await prisma.distributionBatch.findMany({
    where: {
      status: "queued",
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  for (const row of rows) {
    try {
      await prisma.distributionBatch.update({
        where: { id: row.id },
        data: { status: "processing", lastError: null },
      });

      const pack = row.packJson as unknown as SocialDistributionPack;
      const twitter = await postTwitterThread(pack.twitterThread ?? []);
      const linkedin = await postLinkedInArticle(pack.linkedIn ?? "");
      const pinterest = await postPinterestPin({
        title: pack.pinterest?.title ?? row.title,
        description: pack.pinterest?.description ?? "",
        link: pack.meta?.canonicalUrl ?? row.canonicalUrl,
      });

      const resultJson = { twitter, linkedin, pinterest };
      const twFail = twitter.some((t) => !t.ok && !t.skipped);
      const liFail = !linkedin.ok && !linkedin.skipped;
      const piFail = !pinterest.ok && !pinterest.skipped;

      let status: DistributionBatchStatus = "completed";
      if (twFail || liFail || piFail) {
        status = "partial_failure";
      }
      const allSkipped =
        twitter.every((t) => t.skipped) &&
        linkedin.skipped &&
        pinterest.skipped;
      if (allSkipped) {
        status = "completed";
      }

      await prisma.distributionBatch.update({
        where: { id: row.id },
        data: {
          status,
          resultJson,
          lastError:
            status === "partial_failure"
              ? "One or more platforms returned errors (see resultJson)"
              : null,
        },
      });
      processed++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${row.id}: ${msg}`);
      await prisma.distributionBatch.update({
        where: { id: row.id },
        data: { status: "failed", lastError: msg },
      });
    }
  }

  return { processed, errors };
}
