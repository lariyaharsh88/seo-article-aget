import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Fetch for user-supplied URLs (SSRF guard): http(s) only, resolves DNS and blocks
 * private / loopback / link-local / metadata addresses, and re-checks every redirect hop.
 * Note: a DNS rebind between check and connect is still theoretically possible.
 */
export class UnsafeUrlError extends Error {}

function isPrivateV4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateV4(ip);
  const v6 = ip.toLowerCase();
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateV4(mapped[1]);
  return (
    v6 === "::" ||
    v6 === "::1" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") ||
    v6.startsWith("fe80") ||
    v6.startsWith("ff")
  );
}

export async function assertPublicUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new UnsafeUrlError("Invalid URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new UnsafeUrlError("Only http(s) URLs are allowed");
  }
  if (u.username || u.password) throw new UnsafeUrlError("URLs with credentials are not allowed");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) {
    throw new UnsafeUrlError("This host is not allowed");
  }
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (!addrs.length) throw new UnsafeUrlError("Could not resolve host");
  if (addrs.some((a) => isPrivateIp(a.address))) {
    throw new UnsafeUrlError("This host is not allowed");
  }
  return u;
}

export async function safeFetch(
  raw: string,
  init: RequestInit = {},
  maxRedirects = 5,
): Promise<Response> {
  let current = raw;
  for (let i = 0; i <= maxRedirects; i++) {
    const u = await assertPublicUrl(current);
    const res = await fetch(u, { ...init, redirect: "manual" });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, u).toString();
      continue;
    }
    return res;
  }
  throw new UnsafeUrlError("Too many redirects");
}
