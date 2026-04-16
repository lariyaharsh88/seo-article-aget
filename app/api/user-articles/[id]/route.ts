import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseUserFromRequest } from "@/lib/supabase-server";

export const runtime = "nodejs";

type Props = { params: { id: string } };

export async function GET(request: Request, { params }: Props) {
  const user = await getSupabaseUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const row = await prisma.userGeneratedArticle.findFirst({
    where: { id, supabaseUserId: user.id },
    select: {
      id: true,
      title: true,
      topic: true,
      primaryKeyword: true,
      sourceUrl: true,
      markdown: true,
      wordCount: true,
      createdAt: true,
    },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    item: {
      ...row,
      createdAt: row.createdAt.toISOString(),
    },
  });
}
