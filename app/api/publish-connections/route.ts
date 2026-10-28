import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  CREDENTIAL_KEYS,
  getAdapter,
  isPublishPlatform,
  normalizeSiteUrl,
  PublishError,
  type PublishConn,
} from "@/lib/publish";
import { sanitizeSettings } from "@/lib/publish/connection";
import { encryptJson } from "@/lib/secret-box";
import { getSupabaseUserFromRequest } from "@/lib/supabase-server";

export const runtime = "nodejs";

const PUBLIC_SELECT = {
  id: true,
  platform: true,
  label: true,
  siteUrl: true,
  settings: true,
  createdAt: true,
} as const;

export async function GET(request: Request) {
  const user = await getSupabaseUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await prisma.publishConnection.findMany({
      where: { supabaseUserId: user.id },
      orderBy: { createdAt: "desc" },
      select: PUBLIC_SELECT,
    });
    return NextResponse.json({
      items: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    });
  } catch (e) {
    console.error("[publish-connections] GET failed:", e);
    return NextResponse.json({ error: "Could not load connections" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSupabaseUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    platform?: unknown;
    label?: unknown;
    siteUrl?: unknown;
    credentials?: unknown;
    settings?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isPublishPlatform(body.platform)) {
    return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
  }
  const platform = body.platform;
  const rawCreds =
    body.credentials && typeof body.credentials === "object"
      ? (body.credentials as Record<string, unknown>)
      : {};
  const credentials: Record<string, string> = {};
  for (const key of CREDENTIAL_KEYS[platform]) {
    const v = rawCreds[key];
    if (typeof v !== "string" || !v.trim()) {
      return NextResponse.json({ error: `Missing credential: ${key}` }, { status: 400 });
    }
    credentials[key] = v.trim();
  }

  const settings = sanitizeSettings(body.settings);
  let siteUrl = "";
  try {
    const rawSite = typeof body.siteUrl === "string" ? body.siteUrl : "";
    if (platform === "webflow") {
      siteUrl = rawSite.trim() ? normalizeSiteUrl(rawSite, { allowBareHost: true }) : "";
    } else {
      siteUrl = normalizeSiteUrl(rawSite, { allowBareHost: platform === "shopify" });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const conn: PublishConn = { platform, siteUrl, credentials, settings };
  let info: string | undefined;
  try {
    const test = await getAdapter(platform).testConnection(conn);
    info = test.info;
    if (test.settings) Object.assign(settings, test.settings);
  } catch (e) {
    const msg = e instanceof PublishError ? e.message : "Connection test failed";
    if (!(e instanceof PublishError)) console.error("[publish-connections] test failed:", e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const label =
    (typeof body.label === "string" && body.label.trim().slice(0, 80)) ||
    siteUrl.replace(/^https:\/\//, "") ||
    platform;

  try {
    const row = await prisma.publishConnection.create({
      data: {
        supabaseUserId: user.id,
        platform,
        label,
        siteUrl,
        credentialsEnc: encryptJson(credentials),
        settings,
      },
      select: PUBLIC_SELECT,
    });
    return NextResponse.json({
      ok: true,
      info,
      item: { ...row, createdAt: row.createdAt.toISOString() },
    });
  } catch (e) {
    console.error("[publish-connections] POST failed:", e);
    const msg = (e as Error).message?.includes("CREDENTIALS_ENCRYPTION_KEY")
      ? "Server is missing CREDENTIALS_ENCRYPTION_KEY"
      : "Could not save connection";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
