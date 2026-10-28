"use client";

import { useState, type ReactNode } from "react";

export const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
export const labelCls = "block text-sm font-medium text-text-primary";
export const btnCls =
  "inline-flex min-h-10 items-center justify-center rounded-lg bg-accent px-4 py-2 font-mono text-sm font-semibold text-background hover:opacity-90 disabled:opacity-40";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-surface p-5 md:p-6 ${className}`}>{children}</div>;
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      disabled={!text}
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
      className="rounded-md border border-border px-2.5 py-1 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent disabled:opacity-40"
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/60 p-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl text-text-primary">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-text-muted">{hint}</p> : null}
    </div>
  );
}

/** Green / amber / red pill for a pass/warn/fail check. */
export function StatusPill({ status }: { status: "pass" | "warn" | "fail" }) {
  const map = {
    pass: ["Good", "bg-emerald-500/15 text-emerald-400"],
    warn: ["Improve", "bg-amber-500/15 text-amber-400"],
    fail: ["Fix", "bg-red-500/15 text-red-400"],
  } as const;
  const [text, cls] = map[status];
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{text}</span>;
}
