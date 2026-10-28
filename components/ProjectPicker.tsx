"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type ProjectOption = { id: string; name: string };

export default function ProjectPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (projectId: string | null) => void;
}) {
  const [state, setState] = useState<"loading" | "signed-out" | "ready" | "error">("loading");
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await getSupabaseBrowserClient().auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          if (!cancelled) setState("signed-out");
          return;
        }
        const res = await fetch("/api/projects", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(String(res.status));
        const payload = (await res.json()) as { items?: ProjectOption[] };
        if (cancelled) return;
        setProjects(Array.isArray(payload.items) ? payload.items : []);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Drop a selection that no longer exists (e.g. deleted project).
  useEffect(() => {
    if (state === "ready" && value && !projects.some((p) => p.id === value)) onChange(null);
  }, [state, value, projects, onChange]);

  if (state === "signed-out") {
    return (
      <p className="font-mono text-xs text-text-muted">
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>{" "}
        to use brand voice &amp; projects
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="project-picker" className="font-mono text-xs text-text-muted">
        Project
      </label>
      <select
        id="project-picker"
        value={value ?? ""}
        disabled={state !== "ready"}
        onChange={(e) => onChange(e.target.value || null)}
        className="min-h-9 rounded-lg border border-border bg-surface px-2 py-1 font-mono text-xs text-text-primary focus:border-accent focus:outline-none disabled:opacity-60"
      >
        <option value="">
          {state === "loading" ? "Loading…" : state === "error" ? "Projects unavailable" : "No project"}
        </option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <Link href="/dashboard/projects" className="font-mono text-xs text-accent hover:underline">
        Manage projects
      </Link>
    </div>
  );
}
