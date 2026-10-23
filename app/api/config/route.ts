import { NextResponse } from "next/server";
import { serverKeyStatus } from "@/lib/api-keys";
import { getSupabaseUserFromRequest } from "@/lib/supabase-server";
import { isUnlimitedEmail } from "@/lib/unlimited-users";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Public: expose only what the UI needs. Which provider keys exist is not the client's business.
    // `unlimited` is true only for a signed-in account listed in UNLIMITED_EMAILS.
    const user = await getSupabaseUserFromRequest(request).catch(() => null);
    return NextResponse.json({
      searchConsole: serverKeyStatus().searchConsole,
      unlimited: isUnlimitedEmail(user?.email),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Config error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
