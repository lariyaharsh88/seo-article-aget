import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SOURCE_VALUES = new Set(["blog", "news"]);

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(request: Request) {
  let body: {
    source?: string;
    articleSlug?: string;
    articleTitle?: string;
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    /** Honeypot — must be empty for humans */
    website?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const source = typeof body.source === "string" ? body.source.trim() : "";
  if (!SOURCE_VALUES.has(source)) {
    return NextResponse.json(
      { error: "source must be blog or news" },
      { status: 400 },
    );
  }

  const articleSlug =
    typeof body.articleSlug === "string" ? body.articleSlug.trim() : "";
  const articleTitle =
    typeof body.articleTitle === "string" ? body.articleTitle.trim() : "";
  if (articleSlug.length < 1 || articleSlug.length > 500) {
    return NextResponse.json({ error: "Invalid article slug" }, { status: 400 });
  }
  if (articleTitle.length < 1 || articleTitle.length > 500) {
    return NextResponse.json({ error: "Invalid article title" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 120) {
    return NextResponse.json(
      { error: "Name must be between 2 and 120 characters" },
      { status: 400 },
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || email.length > 254 || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const phone =
    typeof body.phone === "string" && body.phone.trim()
      ? body.phone.trim().slice(0, 40)
      : null;
  if (phone && phone.length > 40) {
    return NextResponse.json({ error: "Phone is too long" }, { status: 400 });
  }

  const message =
    typeof body.message === "string" && body.message.trim()
      ? body.message.trim().slice(0, 2000)
      : null;

  try {
    await prisma.leadInquiry.create({
      data: {
        source,
        articleSlug,
        articleTitle,
        name,
        email,
        phone,
        message,
      },
    });
  } catch (err) {
    console.error("[api/leads] create error:", err);
    return NextResponse.json(
      { error: "Could not save your request. Try again later." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
