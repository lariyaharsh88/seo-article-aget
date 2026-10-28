import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseUserFromRequest } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getSupabaseUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const res = await prisma.publishConnection.deleteMany({
      where: { id: params.id, supabaseUserId: user.id },
    });
    if (res.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[publish-connections] DELETE failed:", e);
    return NextResponse.json({ error: "Could not delete connection" }, { status: 500 });
  }
}
