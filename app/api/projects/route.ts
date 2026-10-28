import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PROJECT_LIMITS,
  serializeProject,
  validateProjectInput,
  type ProjectInput,
} from "@/lib/project-context";
import { getSupabaseUserFromRequest } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getSupabaseUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await prisma.project.findMany({
      where: { supabaseUserId: user.id },
      orderBy: { updatedAt: "desc" },
      take: PROJECT_LIMITS.maxPerUser,
    });
    return NextResponse.json({ items: rows.map(serializeProject) });
  } catch (e) {
    console.error("[projects] GET failed:", e);
    return NextResponse.json({ error: "Could not load projects." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSupabaseUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: ProjectInput;
  try {
    body = (await request.json()) as ProjectInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const v = validateProjectInput(body ?? {}, false);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  try {
    const count = await prisma.project.count({ where: { supabaseUserId: user.id } });
    if (count >= PROJECT_LIMITS.maxPerUser) {
      return NextResponse.json(
        { error: `Project limit reached (${PROJECT_LIMITS.maxPerUser}).` },
        { status: 409 },
      );
    }
    const row = await prisma.project.create({
      data: { ...v.data, name: v.data.name as string, supabaseUserId: user.id },
    });
    return NextResponse.json({ item: serializeProject(row) }, { status: 201 });
  } catch (e) {
    console.error("[projects] POST failed:", e);
    return NextResponse.json({ error: "Could not create project." }, { status: 500 });
  }
}
