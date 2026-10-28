import type { Prisma } from "@prisma/client";
import { decryptJson } from "@/lib/secret-box";
import { isPublishPlatform, type PublishConn, type PublishSettings } from "./index";
import { PublishError } from "./types";

export function sanitizeSettings(input: unknown): PublishSettings {
  const out: PublishSettings = {};
  if (!input || typeof input !== "object") return out;
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(k)) continue;
    if (typeof v === "string" && v.trim()) out[k] = v.trim().slice(0, 300);
    else if (typeof v === "number") out[k] = String(v);
  }
  return out;
}

export function rowToConn(row: {
  platform: string;
  siteUrl: string;
  credentialsEnc: string;
  settings: Prisma.JsonValue | null;
}): PublishConn {
  if (!isPublishPlatform(row.platform)) throw new PublishError("Unknown platform on connection");
  return {
    platform: row.platform,
    siteUrl: row.siteUrl,
    credentials: decryptJson<Record<string, string>>(row.credentialsEnc),
    settings: sanitizeSettings(row.settings),
  };
}
