import { NextResponse } from "next/server";
import { buildDistributionPack } from "@/lib/distribution-pack";

type Body = {
  title?: string;
  url?: string;
  excerpt?: string;
  campaign?: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const title = body.title?.trim();
  const url = body.url?.trim();
  if (!title || !url) {
    return NextResponse.json(
      { error: "title and url are required." },
      { status: 400 },
    );
  }

  const pack = buildDistributionPack({
    title,
    url,
    excerpt: body.excerpt,
    campaign: body.campaign?.trim(),
  });
  return NextResponse.json(pack);
}
