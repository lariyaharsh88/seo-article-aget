import { NextResponse } from "next/server";
import { serverKeyStatus } from "@/lib/api-keys";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Public: expose only what the UI needs. Which provider keys exist is not the client's business.
    return NextResponse.json({ searchConsole: serverKeyStatus().searchConsole });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Config error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
