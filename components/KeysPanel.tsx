"use client";

import { useEffect, useState } from "react";

export interface ApiKeys {
  gemini: string;
  tavily: string;
  serper: string;
}

const STORAGE = "rankflowhq-agent-keys";

function loadKeys(): ApiKeys {
  if (typeof window === "undefined") {
    return { gemini: "", tavily: "", serper: "" };
  }
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return { gemini: "", tavily: "", serper: "" };
    const parsed = JSON.parse(raw) as Partial<ApiKeys>;
    return {
      gemini: typeof parsed.gemini === "string" ? parsed.gemini : "",
      tavily: typeof parsed.tavily === "string" ? parsed.tavily : "",
      serper: typeof parsed.serper === "string" ? parsed.serper : "",
    };
  } catch {
    return { gemini: "", tavily: "", serper: "" };
  }
}

export function readStoredKeys(): ApiKeys {
  return loadKeys();
}

interface KeysPanelProps {
  keys: ApiKeys;
  onChange: (keys: ApiKeys) => void;
  serverKeysReady: boolean;
}

export function KeysPanel({ keys, onChange, serverKeysReady }: KeysPanelProps) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    onChange(loadKeys());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(keys));
  }, [keys]);

  const localComplete =
    keys.gemini.trim() && keys.tavily.trim() && keys.serper.trim();
  const allSet = Boolean(localComplete) || serverKeysReady;

  const set =
    (field: keyof ApiKeys) => (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...keys, [field]: e.target.value });

  return (
    <section
      className="rounded-xl border border-border bg-surface/80 p-4 shadow-lg shadow-black/20 backdrop-blur transition-all duration-200"
      aria-labelledby="keys-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 id="keys-heading" className="font-mono text-sm uppercase text-accent">
            Service connections
          </h2>
          {allSet ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 font-mono text-xs text-success"
              aria-label="All required service connections are configured"
            >
              <span aria-hidden>✓</span> Ready
            </span>
          ) : (
            <span className="font-mono text-xs text-text-muted">
              Configure access to continue
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-text-secondary transition-colors duration-200 hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent"
          aria-expanded={open}
          aria-controls="keys-panel-fields"
        >
          {open ? "Collapse" : "Expand"}
        </button>
      </div>
      {open && (
        <div
          id="keys-panel-fields"
          className="mt-4 grid gap-4 md:grid-cols-3"
        >
          <label className="flex flex-col gap-1 font-mono text-xs text-text-secondary">
            Content service
            <input
              type="password"
              autoComplete="off"
              value={keys.gemini}
              onChange={set("gemini")}
              placeholder="AIza…"
              className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </label>
          <label className="flex flex-col gap-1 font-mono text-xs text-text-secondary">
            Research service
            <input
              type="password"
              autoComplete="off"
              value={keys.tavily}
              onChange={set("tavily")}
              placeholder="tvly-…"
              className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </label>
          <label className="flex flex-col gap-1 font-mono text-xs text-text-secondary">
            Search service
            <input
              type="password"
              autoComplete="off"
              value={keys.serper}
              onChange={set("serper")}
              placeholder="Search service key"
              className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </label>
          {serverKeysReady && (
            <p className="md:col-span-3 font-mono text-xs text-info">
              Server-side access detected. Local fields can stay empty.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
