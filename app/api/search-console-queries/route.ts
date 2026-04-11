import { NextResponse } from "next/server";
import {
  fetchSearchConsoleTopQueries,
  parseGscApiError,
  searchConsoleEnvConfigured,
} from "@/lib/gsc-queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Body {
  pageUrl?: string;
  rowLimit?: number;
}

export async function POST(request: Request) {
  if (!searchConsoleEnvConfigured()) {
    return NextResponse.json(
      {
        error:
          "Search Console is not configured. Add GSC_SITE_URL and GSC_SERVICE_ACCOUNT_JSON (recommended), or OAuth vars — see .env.example.",
        queries: [],
        details: [],
      },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as Body;
    const { details, note } = await fetchSearchConsoleTopQueries({
      pageUrl: body.pageUrl,
      rowLimit: body.rowLimit,
    });
    return NextResponse.json({
      queries: details.map((d) => d.query),
      details,
      ...(note ? { note } : {}),
    });
  } catch (e) {
    const { message, hint, status } = parseGscApiError(e);
    return NextResponse.json(
      {
        error: message,
        ...(hint ? { hint } : {}),
        queries: [],
        details: [],
      },
      { status },
    );
  }
}
