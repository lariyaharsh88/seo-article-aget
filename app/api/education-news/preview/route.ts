import { NextResponse } from "next/server";
import { addExternalLinkRelToHtml } from "@/lib/html-external-links";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const articleUrl = searchParams.get("url");

    if (!articleUrl) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 },
      );
    }

    const response = await fetch(articleUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status}`);
    }

    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const contentMatch =
      html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
      html.match(
        /<div[^>]*class=["'][^"']*(?:content|article)["'][^>]*>([\s\S]*?)<\/div>/i,
      );

    const rawHtml = contentMatch ? contentMatch[1] : html;
    return NextResponse.json({
      success: true,
      url: articleUrl,
      title: titleMatch ? titleMatch[1].trim() : "Untitled",
      htmlContent: addExternalLinkRelToHtml(rawHtml),
      extractedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: "Failed to fetch article content" },
      { status: 500 },
    );
  }
}
