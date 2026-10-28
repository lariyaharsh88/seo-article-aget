import type { Project } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { capPromptText } from "@/lib/prompt-truncate";

export const PROJECT_LIMITS = {
  name: 80,
  siteUrl: 500,
  audience: 300,
  brandVoice: 4000,
  knowledgeBase: 20000,
  maxPerUser: 50,
} as const;

/** Returns the project only if it belongs to the user; null otherwise (or on bad input). */
export async function loadProjectForUser(
  projectId: string,
  supabaseUserId: string,
): Promise<Project | null> {
  if (!projectId || !supabaseUserId) return null;
  try {
    return await prisma.project.findFirst({ where: { id: projectId, supabaseUserId } });
  } catch (e) {
    console.error("[project-context] load failed:", e);
    return null;
  }
}

/** Prompt section that steers generation with the project's brand voice and knowledge base. */
export function buildProjectPromptBlock(
  project: Pick<Project, "name" | "siteUrl" | "brandVoice" | "knowledgeBase">,
): string {
  const parts: string[] = [];
  const header = [`PROJECT / BRAND: ${project.name.trim()}`];
  if (project.siteUrl?.trim()) header.push(`SITE: ${project.siteUrl.trim()}`);
  parts.push(header.join("\n"));
  const voice = project.brandVoice?.trim();
  if (voice) {
    parts.push(
      `BRAND VOICE (follow strictly; it overrides generic tone guidance where they conflict):\n${capPromptText(voice, PROJECT_LIMITS.brandVoice)}`,
    );
  }
  const kb = project.knowledgeBase?.trim();
  if (kb) {
    parts.push(
      `KNOWLEDGE BASE (facts about the business — use where relevant, never contradict, never invent facts beyond it):\n${capPromptText(kb, 12_000)}`,
    );
  }
  if (!voice && !kb) return "";
  return parts.join("\n\n");
}

export type ProjectInput = {
  name?: unknown;
  siteUrl?: unknown;
  audience?: unknown;
  brandVoice?: unknown;
  knowledgeBase?: unknown;
};

export type ProjectData = {
  name?: string;
  siteUrl?: string | null;
  audience?: string | null;
  brandVoice?: string;
  knowledgeBase?: string;
};

/** Validates create/patch input. `partial` = PATCH (only provided fields are checked). */
export function validateProjectInput(
  body: ProjectInput,
  partial: boolean,
): { ok: true; data: ProjectData } | { ok: false; error: string } {
  const data: ProjectData = {};
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : null);

  if (!partial || body.name !== undefined) {
    const name = str(body.name);
    if (!name) return { ok: false, error: "name is required" };
    if (name.length > PROJECT_LIMITS.name) return { ok: false, error: `name must be ≤ ${PROJECT_LIMITS.name} chars` };
    data.name = name;
  }
  if (!partial || body.siteUrl !== undefined) {
    const u = str(body.siteUrl);
    if (u === null) return { ok: false, error: "siteUrl must be a string" };
    if (u) {
      if (u.length > PROJECT_LIMITS.siteUrl) return { ok: false, error: "siteUrl too long" };
      try {
        const parsed = new URL(u);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
      } catch {
        return { ok: false, error: "siteUrl must be an http(s) URL" };
      }
    }
    data.siteUrl = u || null;
  }
  if (!partial || body.audience !== undefined) {
    const a = str(body.audience);
    if (a === null) return { ok: false, error: "audience must be a string" };
    if (a.length > PROJECT_LIMITS.audience) return { ok: false, error: `audience must be ≤ ${PROJECT_LIMITS.audience} chars` };
    data.audience = a || null;
  }
  if (!partial || body.brandVoice !== undefined) {
    const v = str(body.brandVoice);
    if (v === null) return { ok: false, error: "brandVoice must be a string" };
    if (v.length > PROJECT_LIMITS.brandVoice) return { ok: false, error: `brandVoice must be ≤ ${PROJECT_LIMITS.brandVoice} chars` };
    data.brandVoice = v;
  }
  if (!partial || body.knowledgeBase !== undefined) {
    const k = str(body.knowledgeBase);
    if (k === null) return { ok: false, error: "knowledgeBase must be a string" };
    if (k.length > PROJECT_LIMITS.knowledgeBase) return { ok: false, error: `knowledgeBase must be ≤ ${PROJECT_LIMITS.knowledgeBase} chars` };
    data.knowledgeBase = k;
  }
  return { ok: true, data };
}

export function serializeProject(p: Project) {
  return { ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() };
}
