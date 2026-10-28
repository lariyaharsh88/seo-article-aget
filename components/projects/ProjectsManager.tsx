"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Project = {
  id: string;
  name: string;
  siteUrl: string | null;
  audience: string | null;
  brandVoice: string;
  knowledgeBase: string;
  updatedAt: string;
};

type Draft = { name: string; siteUrl: string; audience: string; brandVoice: string; knowledgeBase: string };

const EMPTY: Draft = { name: "", siteUrl: "", audience: "", brandVoice: "", knowledgeBase: "" };
const LIMITS = { name: 80, brandVoice: 4000, knowledgeBase: 20000 };

const inputCls =
  "mt-1 w-full rounded-lg border border-border bg-background/40 px-3 py-2 font-serif text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none";
const labelCls = "block font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted";

async function getToken(): Promise<string | null> {
  const { data } = await getSupabaseBrowserClient().auth.getSession();
  return data.session?.access_token ?? null;
}

export default function ProjectsManager() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken();
      if (!token) {
        setSignedIn(false);
        return;
      }
      setSignedIn(true);
      const res = await fetch("/api/projects", { headers: { Authorization: `Bearer ${token}` } });
      const payload = (await res.json().catch(() => ({}))) as { items?: Project[]; error?: string };
      if (!res.ok) throw new Error(payload.error || `HTTP ${res.status}`);
      setProjects(payload.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startEdit = (p: Project | null) => {
    setError(null);
    if (p) {
      setEditingId(p.id);
      setDraft({
        name: p.name,
        siteUrl: p.siteUrl ?? "",
        audience: p.audience ?? "",
        brandVoice: p.brandVoice,
        knowledgeBase: p.knowledgeBase,
      });
    } else {
      setEditingId("new");
      setDraft(EMPTY);
    }
  };

  const save = async () => {
    if (!draft.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again.");
      const isNew = editingId === "new";
      const res = await fetch(isNew ? "/api/projects" : `/api/projects/${encodeURIComponent(editingId ?? "")}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(draft),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(payload.error || `HTTP ${res.status}`);
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Project) => {
    if (!window.confirm(`Delete project "${p.name}"? Articles stay saved but are unlinked.`)) return;
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again.");
      const res = await fetch(`/api/projects/${encodeURIComponent(p.id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete failed (HTTP ${res.status})`);
      if (editingId === p.id) setEditingId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  if (!loading && !signedIn) {
    return (
      <section className="mt-5 rounded-2xl border border-border/80 bg-surface/50 p-5 font-serif text-sm text-text-secondary">
        Please{" "}
        <Link href="/login" className="text-accent hover:underline">
          sign in
        </Link>{" "}
        to manage projects.
      </section>
    );
  }

  const field = (key: keyof Draft, value: string) => setDraft((d) => ({ ...d, [key]: value }));

  return (
    <div className="mt-5 space-y-5">
      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-400">{error}</p>
      ) : null}

      {editingId ? (
        <section className="rounded-2xl border border-accent/40 bg-surface/50 p-5">
          <h2 className="font-display text-xl text-text-primary">{editingId === "new" ? "New project" : "Edit project"}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className={labelCls}>
              Name
              <input className={inputCls} maxLength={LIMITS.name} value={draft.name} onChange={(e) => field("name", e.target.value)} placeholder="Acme Coffee blog" />
            </label>
            <label className={labelCls}>
              Site URL
              <input className={inputCls} value={draft.siteUrl} onChange={(e) => field("siteUrl", e.target.value)} placeholder="https://acmecoffee.com" />
            </label>
            <label className={`${labelCls} md:col-span-2`}>
              Audience
              <input className={inputCls} value={draft.audience} onChange={(e) => field("audience", e.target.value)} placeholder="Home baristas in the US, beginner to intermediate" />
            </label>
            <label className={`${labelCls} md:col-span-2`}>
              Brand voice <span className="normal-case tracking-normal">({draft.brandVoice.length}/{LIMITS.brandVoice})</span>
              <textarea
                className={`${inputCls} min-h-32`}
                maxLength={LIMITS.brandVoice}
                value={draft.brandVoice}
                onChange={(e) => field("brandVoice", e.target.value)}
                placeholder={"Friendly, plain-spoken, a little nerdy about coffee. Second person (\"you\"). Short paragraphs. No hype words like \"revolutionary\". British spelling. Always say \"Acme\" not \"Acme Coffee Co.\""}
              />
            </label>
            <label className={`${labelCls} md:col-span-2`}>
              Knowledge base <span className="normal-case tracking-normal">({draft.knowledgeBase.length}/{LIMITS.knowledgeBase})</span>
              <textarea
                className={`${inputCls} min-h-64 font-mono text-xs`}
                maxLength={LIMITS.knowledgeBase}
                value={draft.knowledgeBase}
                onChange={(e) => field("knowledgeBase", e.target.value)}
                placeholder={"- Founded 2014 in Portland\n- Subscription: $18/month, free shipping over $30\n- Never claim: organic certification, health benefits"}
              />
              <span className="mt-1 block font-serif text-xs normal-case tracking-normal text-text-muted">
                Paste product facts, pricing, USPs, things to never claim.
              </span>
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 py-2 font-mono text-xs font-semibold text-background hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save project"}
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 font-mono text-xs text-text-secondary hover:text-accent"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-border/80 bg-surface/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl text-text-primary">Your projects</h2>
          <button
            type="button"
            onClick={() => startEdit(null)}
            className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 py-2 font-mono text-xs font-semibold text-background hover:opacity-90"
          >
            New project
          </button>
        </div>
        {loading ? (
          <div className="skeleton mt-4 h-16 rounded-xl" />
        ) : projects.length === 0 ? (
          <p className="mt-4 font-serif text-sm text-text-muted">
            No projects yet. Create one per site or client to keep voice and facts consistent.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {projects.map((p) => (
              <li key={p.id} className="rounded-xl border border-border/80 bg-background/35 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-text-primary">{p.name}</p>
                    {p.siteUrl ? <p className="truncate font-mono text-xs text-text-muted">{p.siteUrl}</p> : null}
                    <p className="mt-1 font-serif text-xs text-text-muted">
                      Voice: {p.brandVoice ? `${p.brandVoice.length} chars` : "—"} · Knowledge: {p.knowledgeBase ? `${p.knowledgeBase.length} chars` : "—"}
                      {p.audience ? ` · Audience: ${p.audience}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(p)} className="font-mono text-xs text-accent hover:underline">
                      Edit
                    </button>
                    <button type="button" onClick={() => void remove(p)} className="font-mono text-xs text-text-muted hover:text-red-400">
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
