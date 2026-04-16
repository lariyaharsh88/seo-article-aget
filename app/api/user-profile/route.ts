import { NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const DISPLAY_NAME_MAX = 120;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** GET — load profile for the authenticated Supabase user. */
export async function GET(request: Request) {
  const user = await getSupabaseUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized. Send Authorization: Bearer <supabase_access_token>." },
      { status: 401 },
    );
  }

  try {
    const row = await prisma.userProfile.findUnique({
      where: { supabaseUserId: user.id },
      select: { displayName: true, email: true, updatedAt: true },
    });
    return NextResponse.json({
      profile: row
        ? {
            displayName: row.displayName,
            email: row.email ?? user.email ?? null,
            updatedAt: row.updatedAt.toISOString(),
          }
        : {
            displayName: null,
            email: user.email ?? null,
            updatedAt: null,
          },
    });
  } catch (e) {
    console.error("[user-profile] GET:", e);
    return NextResponse.json(
      { error: "Could not load profile." },
      { status: 500 },
    );
  }
}

/** PATCH — upsert display name (and refresh stored email). */
export async function PATCH(request: Request) {
  const user = await getSupabaseUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized. Send Authorization: Bearer <supabase_access_token>." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawName = isRecord(body) ? body.displayName : undefined;
  const displayName =
    typeof rawName === "string" ? rawName.trim().slice(0, DISPLAY_NAME_MAX) : "";

  try {
    const row = await prisma.userProfile.upsert({
      where: { supabaseUserId: user.id },
      create: {
        supabaseUserId: user.id,
        email: user.email ?? null,
        displayName: displayName || null,
      },
      update: {
        email: user.email ?? null,
        displayName: displayName || null,
      },
      select: { displayName: true, email: true, updatedAt: true },
    });

    return NextResponse.json({
      ok: true,
      profile: {
        displayName: row.displayName,
        email: row.email ?? user.email ?? null,
        updatedAt: row.updatedAt.toISOString(),
      },
    });
  } catch (e) {
    console.error("[user-profile] PATCH:", e);
    return NextResponse.json(
      { error: "Could not save profile." },
      { status: 500 },
    );
  }
}
