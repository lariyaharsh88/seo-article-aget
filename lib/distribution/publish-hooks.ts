import { revalidatePath } from "next/cache";
import { notifyIndexNowUrlsIfConfigured } from "@/lib/indexnow-submit";
import { getSiteUrl } from "@/lib/site-url";

export type PublishHookResult = {
  revalidated: string[];
  indexNow: "sent" | "skipped" | "error";
  indexNowDetail?: string;
};

/**
 * Call after a new URL goes live: bust Next.js cache for sitemap-related routes + IndexNow ping.
 * Google does not use IndexNow; still submit sitemap in GSC manually or via API separately.
 */
export async function runPostPublishDistributionHooks(opts: {
  canonicalUrls: string[];
  /** Also revalidate app routes that aggregate content */
  revalidatePaths?: string[];
}): Promise<PublishHookResult> {
  const paths = Array.from(
    new Set(["/sitemap.xml", "/feed.xml", ...(opts.revalidatePaths ?? [])]),
  );
  const revalidated: string[] = [];
  for (const p of paths) {
    try {
      revalidatePath(p);
      revalidated.push(p);
    } catch (e) {
      console.error("[distribution] revalidatePath failed", p, e);
    }
  }

  let indexNow: PublishHookResult["indexNow"] = "skipped";
  let indexNowDetail: string | undefined;
  try {
    const key = process.env.INDEXNOW_KEY?.trim();
    if (key && opts.canonicalUrls.length > 0) {
      await notifyIndexNowUrlsIfConfigured({
        urls: opts.canonicalUrls,
        includeNewsSitemap: false,
      });
      indexNow = "sent";
    } else if (!key) {
      indexNow = "skipped";
      indexNowDetail = "INDEXNOW_KEY not set";
    }
  } catch (e) {
    indexNow = "error";
    indexNowDetail = e instanceof Error ? e.message : String(e);
  }

  return { revalidated, indexNow, indexNowDetail };
}

export function absoluteSitemapUrl(): string {
  const base = getSiteUrl().replace(/\/$/, "");
  return `${base}/sitemap.xml`;
}

export function absoluteFeedUrl(): string {
  const base = getSiteUrl().replace(/\/$/, "");
  return `${base}/feed.xml`;
}
