import { NextResponse } from "next/server";
import {
  applyInternalLinksToMarkdown,
  type ApplyLinksOptions,
} from "@/lib/internal-linking/apply-markdown";

interface ApplyBody {
  markdown?: string;
  links?: { toId: string; anchorText: string; href: string }[];
  options?: ApplyLinksOptions;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ApplyBody;
    const markdown = body.markdown?.trim() ?? "";
    const links = body.links;
    if (!markdown) {
      return NextResponse.json({ error: "`markdown` is required" }, { status: 400 });
    }
    if (!Array.isArray(links) || links.length === 0) {
      return NextResponse.json({ error: "`links` must be a non-empty array" }, { status: 400 });
    }

    const result = applyInternalLinksToMarkdown(markdown, links, body.options);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Apply internal links failed";
    console.error("[api/internal-links/apply]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
