import { NextResponse } from "next/server";
import { resolveGeminiKey } from "@/lib/api-keys";
import {
  runRepurposeForArticleId,
  runRepurposePending,
} from "@/lib/education-news/repurpose-runner";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const geminiKey = resolveGeminiKey(request);
  if (!geminiKey) {
    return NextResponse.json(
      { error: "Missing Gemini API key (header or env)." },
      { status: 401 },
    );
  }

  let body: { id?: string; processPending?: boolean; limit?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    if (body.id?.trim()) {
      await runRepurposeForArticleId(body.id.trim(), geminiKey);
      return NextResponse.json({ ok: true, mode: "single", id: body.id.trim() });
    }
    if (body.processPending) {
      const limit =
        typeof body.limit === "number" && body.limit > 0
          ? Math.min(body.limit, 5)
          : 2;
      const out = await runRepurposePending(geminiKey, limit);
      return NextResponse.json({ ok: true, mode: "batch", ...out });
    }
    return NextResponse.json(
      { error: "Provide { id } or { processPending: true }" },
      { status: 400 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Repurpose failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
