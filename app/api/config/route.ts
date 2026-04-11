import { NextResponse } from "next/server";
import { serverKeyStatus } from "@/lib/api-keys";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const keys = serverKeyStatus();
    const serverKeysReady = keys.gemini && keys.tavily && keys.serper;
    return NextResponse.json({
      ...keys,
      serverKeysReady,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Config error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
