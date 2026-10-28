import { PublishError } from "./types";

export function normalizeSiteUrl(input: string, opts: { allowBareHost?: boolean } = {}): string {
  let raw = (input || "").trim();
  if (!raw) throw new PublishError("Site URL is required");
  if (opts.allowBareHost && !/^[a-z]+:\/\//i.test(raw)) raw = `https://${raw}`;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new PublishError("Site URL is not a valid URL");
  }
  if (u.protocol !== "https:") throw new PublishError("Site URL must use https://");
  if (u.username || u.password) throw new PublishError("Site URL must not contain credentials");
  return `${u.origin}${u.pathname}`.replace(/\/+$/, "");
}

export async function requestJson<T = unknown>(
  platformName: string,
  url: string,
  init: RequestInit = {},
  timeoutMs = 20_000,
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: ctrl.signal, redirect: "follow", cache: "no-store" });
  } catch (e) {
    if ((e as Error).name === "AbortError") {
      throw new PublishError(`${platformName} did not respond within ${timeoutMs / 1000}s`, 504);
    }
    throw new PublishError(`Could not reach ${platformName}: ${(e as Error).message}`, 502);
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const detail = extractMessage(data) || text.slice(0, 200);
    throw new PublishError(mapStatus(platformName, res.status, detail), res.status >= 500 ? 502 : 400);
  }
  if (data === null) {
    throw new PublishError(`${platformName} returned an unexpected (non-JSON) response`, 502);
  }
  return data as T;
}

function extractMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as Record<string, unknown>;
  if (typeof d.message === "string") return d.message;
  if (typeof d.msg === "string") return d.msg;
  if (Array.isArray(d.errors)) {
    const first = d.errors[0] as Record<string, unknown> | string | undefined;
    if (typeof first === "string") return first;
    if (first && typeof first.message === "string") return first.message;
  }
  if (d.errors && typeof d.errors === "object") return JSON.stringify(d.errors).slice(0, 200);
  if (typeof d.errors === "string") return d.errors;
  return "";
}

function mapStatus(platform: string, status: number, detail: string): string {
  const suffix = detail ? ` (${detail})` : "";
  switch (status) {
    case 401:
      return `Credentials rejected by ${platform}${suffix}`;
    case 403:
      return `${platform} denied access - check the key's permissions/scopes${suffix}`;
    case 404:
      return `${platform} endpoint not found - check the site URL and settings${suffix}`;
    case 429:
      return `${platform} rate limit hit, try again shortly`;
    default:
      return status >= 500
        ? `${platform} server error (${status})${suffix}`
        : `${platform} rejected the request (${status})${suffix}`;
  }
}
