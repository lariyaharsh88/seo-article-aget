"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Platform = "wordpress" | "ghost" | "webflow" | "shopify";

interface Connection {
  id: string;
  platform: Platform;
  label: string;
  siteUrl: string;
}

export interface PublishPanelProps {
  markdown: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
  tags?: string[];
  disabled?: boolean;
}

type FieldDef = { key: string; label: string; placeholder?: string; secret?: boolean; setting?: boolean; optional?: boolean };

const PLATFORMS: Record<Platform, { name: string; siteLabel: string; sitePlaceholder: string; siteOptional?: boolean; help: string; fields: FieldDef[] }> = {
  wordpress: {
    name: "WordPress",
    siteLabel: "Site URL",
    sitePlaceholder: "https://example.com",
    help: "In wp-admin go to Users → Profile → Application Passwords, create one and paste it here. Requires HTTPS.",
    fields: [
      { key: "username", label: "Username" },
      { key: "appPassword", label: "Application password", secret: true, placeholder: "xxxx xxxx xxxx xxxx" },
    ],
  },
  ghost: {
    name: "Ghost",
    siteLabel: "Site URL",
    sitePlaceholder: "https://blog.example.com",
    help: "Ghost Admin → Settings → Integrations → Add custom integration, then copy the Admin API key (id:secret).",
    fields: [{ key: "adminApiKey", label: "Admin API key", secret: true, placeholder: "6489...:a1b2..." }],
  },
  webflow: {
    name: "Webflow",
    siteLabel: "Live site URL (for links)",
    sitePlaceholder: "https://www.example.com",
    siteOptional: true,
    help: "Site settings → Apps & integrations → Generate API token (CMS read/write). Collection ID is in the CMS collection settings.",
    fields: [
      { key: "apiToken", label: "Site API token", secret: true },
      { key: "collectionId", label: "Collection ID", setting: true },
      { key: "bodyField", label: "Body field slug", setting: true, optional: true, placeholder: "post-body" },
      { key: "summaryField", label: "Summary field slug", setting: true, optional: true, placeholder: "post-summary" },
      { key: "collectionPath", label: "Collection URL path", setting: true, optional: true, placeholder: "blog" },
    ],
  },
  shopify: {
    name: "Shopify",
    siteLabel: "Store domain",
    sitePlaceholder: "mystore.myshopify.com",
    help: "Settings → Apps → Develop apps → create an app with write_content scope, install it and copy the Admin API access token.",
    fields: [
      { key: "accessToken", label: "Admin API access token", secret: true, placeholder: "shpat_..." },
      { key: "blogId", label: "Blog ID", setting: true, optional: true, placeholder: "first blog if empty" },
    ],
  },
};

const inputCls =
  "w-full rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none";
const btnCls =
  "touch-manipulation rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 sm:py-1.5";
const primaryBtnCls =
  "touch-manipulation rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40 sm:py-1.5";

async function getToken(): Promise<string | null> {
  try {
    const { data } = await getSupabaseBrowserClient().auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export function PublishPanel({ markdown, title, metaTitle, metaDescription, slug, tags, disabled }: PublishPanelProps) {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selected, setSelected] = useState("");
  const [mode, setMode] = useState<"draft" | "publish">("draft");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; editUrl?: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [platform, setPlatform] = useState<Platform>("wordpress");
  const [form, setForm] = useState<Record<string, string>>({});

  const authed = useCallback(
    (init: RequestInit = {}) => ({
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}`, ...(init.headers || {}) },
    }),
    [token],
  );

  useEffect(() => {
    void getToken().then(setToken);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/publish-connections", authed());
      const data = (await res.json()) as { items?: Connection[]; error?: string };
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const items = data.items || [];
      setConnections(items);
      setSelected((cur) => (items.some((c) => c.id === cur) ? cur : items[0]?.id || ""));
      if (!items.length) setAdding(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [token, authed]);

  useEffect(() => {
    void load();
  }, [load]);

  const publish = useCallback(async () => {
    if (!selected || !markdown.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        "/api/publish",
        authed({
          method: "POST",
          body: JSON.stringify({ connectionId: selected, markdown, title, status: mode, slug, metaTitle, metaDescription, tags }),
        }),
      );
      const data = (await res.json()) as { error?: string; url?: string; editUrl?: string };
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult({ url: data.url || "", editUrl: data.editUrl });
      const platformName = connections.find((c) => c.id === selected)?.platform;
      trackEvent("feature_usage", { feature_name: "article_publish", action: `publish_${mode}`, platform: platformName ?? "unknown" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [selected, markdown, title, mode, slug, metaTitle, metaDescription, tags, authed, connections]);

  const addConnection = useCallback(async () => {
    const def = PLATFORMS[platform];
    const credentials: Record<string, string> = {};
    const settings: Record<string, string> = {};
    for (const f of def.fields) {
      const v = form[f.key]?.trim() || "";
      if (!v && !f.optional) {
        setError(`${f.label} is required`);
        return;
      }
      if (v) (f.setting ? settings : credentials)[f.key] = v;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/publish-connections",
        authed({
          method: "POST",
          body: JSON.stringify({ platform, label: form.label || "", siteUrl: form.siteUrl || "", credentials, settings }),
        }),
      );
      const data = (await res.json()) as { error?: string; item?: Connection };
      if (!res.ok || !data.item) throw new Error(data.error || `HTTP ${res.status}`);
      trackEvent("feature_usage", { feature_name: "article_publish", action: "add_connection", platform });
      setForm({});
      setAdding(false);
      await load();
      setSelected(data.item.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [platform, form, authed, load]);

  const removeConnection = useCallback(async () => {
    if (!selected || !window.confirm("Remove this connection? Saved credentials will be deleted.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/publish-connections/${encodeURIComponent(selected)}`, authed({ method: "DELETE" }));
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      trackEvent("feature_usage", { feature_name: "article_publish", action: "delete_connection" });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [selected, authed, load]);

  if (token === undefined) return null;

  if (!token) {
    return (
      <div className="mb-4 rounded-xl border border-border bg-surface p-3">
        <span className="font-mono text-[10px] uppercase tracking-wide text-text-muted">Publish to your site</span>
        <p className="mt-1 font-mono text-xs text-text-muted">
          <Link href="/login" className="text-accent hover:underline">
            Sign in to publish to your site
          </Link>{" "}
          (WordPress, Ghost, Webflow, Shopify).
        </p>
      </div>
    );
  }

  const def = PLATFORMS[platform];
  const empty = !markdown.trim();

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wide text-text-muted">Publish to your site</span>
        {connections.length > 0 ? (
          <button type="button" className={btnCls} onClick={() => setAdding((v) => !v)} disabled={busy}>
            {adding ? "Cancel" : "Add connection"}
          </button>
        ) : null}
      </div>

      {connections.length > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            className={`${inputCls} sm:w-auto sm:min-w-[220px]`}
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            aria-label="Publishing connection"
          >
            {connections.map((c) => (
              <option key={c.id} value={c.id}>
                {PLATFORMS[c.platform]?.name ?? c.platform} · {c.label}
              </option>
            ))}
          </select>
          <div className="flex overflow-hidden rounded-lg border border-border" role="group" aria-label="Post status">
            {(["draft", "publish"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`px-3 py-2 font-mono text-xs transition-colors sm:py-1.5 ${
                  mode === m ? "bg-accent/15 text-accent" : "bg-background/80 text-text-muted hover:text-accent"
                }`}
              >
                {m === "draft" ? "Draft" : "Publish"}
              </button>
            ))}
          </div>
          <button type="button" className={primaryBtnCls} onClick={() => void publish()} disabled={disabled || empty || busy || !selected}>
            {busy ? "Working…" : mode === "publish" ? "Publish" : "Send as draft"}
          </button>
          <button type="button" className={btnCls} onClick={() => void removeConnection()} disabled={busy || !selected}>
            Delete connection
          </button>
        </div>
      ) : null}

      {adding ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-background/40 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1 font-mono text-[11px] text-text-muted">
              Platform
              <select
                className={inputCls}
                value={platform}
                onChange={(e) => {
                  setPlatform(e.target.value as Platform);
                  setForm({});
                  setError(null);
                }}
              >
                {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
                  <option key={p} value={p}>
                    {PLATFORMS[p].name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 font-mono text-[11px] text-text-muted">
              Label (optional)
              <input className={inputCls} value={form.label || ""} placeholder="My blog" onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1 font-mono text-[11px] text-text-muted">
              {def.siteLabel}
              {def.siteOptional ? " (optional)" : ""}
              <input className={inputCls} value={form.siteUrl || ""} placeholder={def.sitePlaceholder} onChange={(e) => setForm((f) => ({ ...f, siteUrl: e.target.value }))} />
            </label>
            {def.fields.map((fd) => (
              <label key={fd.key} className="flex flex-col gap-1 font-mono text-[11px] text-text-muted">
                {fd.label}
                {fd.optional ? " (optional)" : ""}
                <input
                  className={inputCls}
                  type={fd.secret ? "password" : "text"}
                  autoComplete="off"
                  value={form[fd.key] || ""}
                  placeholder={fd.placeholder}
                  onChange={(e) => setForm((f) => ({ ...f, [fd.key]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          <p className="font-mono text-[11px] text-text-muted">{def.help} Credentials are tested, then stored encrypted.</p>
          <div>
            <button type="button" className={primaryBtnCls} onClick={() => void addConnection()} disabled={busy}>
              {busy ? "Testing connection…" : "Test & save connection"}
            </button>
          </div>
        </div>
      ) : null}

      {result ? (
        <p className="font-mono text-xs text-success" role="status">
          {mode === "publish" ? "Published" : "Draft created"}.{" "}
          {result.url ? (
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              View post
            </a>
          ) : null}
          {result.editUrl ? (
            <>
              {" · "}
              <a href={result.editUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                Edit in CMS
              </a>
            </>
          ) : null}
        </p>
      ) : null}
      {error ? (
        <p className="font-mono text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
