import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  loadProjectForUser,
  serializeProject,
  validateProjectInput,
  type ProjectInput,
} from "@/lib/project-context";
import { getSupabaseUserFromRequest } from "@/lib/supabase-server";

export const runtime = "nodejs";

type Ctx = { params: { id: string } };
const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

export async function GET(request: Request, { params }: Ctx) {
  const user = await getSupabaseUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = await loadProjectForUser(params.id, user.id);
  return p ? NextResponse.json({ item: serializeProject(p) }) : notFound();
}

export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getSupabaseUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: ProjectInput;
  try {
    body = (await request.json()) as ProjectInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const v = validateProjectInput(body ?? {}, true);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  try {
    const res = await prisma.project.updateMany({
      where: { id: params.id, supabaseUserId: user.id },
      data: v.data,
    });
    if (res.count === 0) return notFound();
    const p = await loadProjectForUser(params.id, user.id);
    return p ? NextResponse.json({ item: serializeProject(p) }) : notFound();
  } catch (e) {
    console.error("[projects] PATCH failed:", e);
    return NextResponse.json({ error: "Could not update project." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  const user = await getSupabaseUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const res = await prisma.project.deleteMany({
      where: { id: params.id, supabaseUserId: user.id },
    });
    if (res.count === 0) return notFound();
    await prisma.userGeneratedArticle.updateMany({
      where: { projectId: params.id, supabaseUserId: user.id },
      data: { projectId: null },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[projects] DELETE failed:", e);
    return NextResponse.json({ error: "Could not delete project." }, { status: 500 });
  }
}
