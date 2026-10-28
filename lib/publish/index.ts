import { ghost } from "./ghost";
import { shopify } from "./shopify";
import { PUBLISH_PLATFORMS, type PublishAdapter, type PublishPlatform } from "./types";
import { webflow } from "./webflow";
import { wordpress } from "./wordpress";

export * from "./types";
export { normalizeSiteUrl } from "./http";

const ADAPTERS: Record<PublishPlatform, PublishAdapter> = { wordpress, ghost, webflow, shopify };

export function isPublishPlatform(p: unknown): p is PublishPlatform {
  return typeof p === "string" && (PUBLISH_PLATFORMS as string[]).includes(p);
}

export function getAdapter(platform: PublishPlatform): PublishAdapter {
  return ADAPTERS[platform];
}

/** Required credential keys per platform. */
export const CREDENTIAL_KEYS: Record<PublishPlatform, string[]> = {
  wordpress: ["username", "appPassword"],
  ghost: ["adminApiKey"],
  webflow: ["apiToken"],
  shopify: ["accessToken"],
};
