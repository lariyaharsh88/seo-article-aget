import { permanentRedirect } from "next/navigation";
import type { SiteDomain } from "@prisma/client";
import {
  absoluteUrlForSiteDomain,
  getRequestSiteDomain,
} from "@/lib/site-domain";

/** If the request host does not match the content’s `siteDomain`, 308 to the canonical URL. */
export async function permanentRedirectIfWrongSiteDomain(
  contentDomain: SiteDomain,
  pathname: string,
  search?: string,
): Promise<void> {
  const requestDomain = await getRequestSiteDomain();
  if (contentDomain === requestDomain) return;
  const q =
    search && search !== "?" && search.length > 0
      ? (search.startsWith("?") ? search : `?${search}`)
      : "";
  permanentRedirect(`${absoluteUrlForSiteDomain(contentDomain, pathname)}${q}`);
}
