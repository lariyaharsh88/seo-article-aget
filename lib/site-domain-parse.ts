import { SiteDomain } from "@prisma/client";

/** Accept `"main"` | `"education"` from JSON bodies; otherwise `null`. */
export function parseSiteDomainInput(raw: unknown): SiteDomain | null {
  if (raw === SiteDomain.main || raw === SiteDomain.education) return raw;
  return null;
}
