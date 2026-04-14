"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISS_KEY = "rankflowhq_exit_intent_dismissed";

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(DISMISS_KEY) === "1") return;

    function onMouseOut(event: MouseEvent) {
      if (event.relatedTarget || event.toElement) return;
      if (event.clientY > 10) return;
      setOpen(true);
      window.removeEventListener("mouseout", onMouseOut);
    }

    window.addEventListener("mouseout", onMouseOut);
    return () => window.removeEventListener("mouseout", onMouseOut);
  }, []);

  function close() {
    setOpen(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/55 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
          Before you leave
        </p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">
          Get SEO article in 30 seconds
        </h2>
        <p className="mt-2 font-serif text-sm text-text-secondary">
          Launch the full pipeline and generate an SEO-ready article now.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/seo-agent"
            onClick={close}
            className="rounded-lg bg-accent px-4 py-2 font-mono text-sm text-background transition-opacity hover:opacity-90"
          >
            Generate SEO Article
          </Link>
          <button
            type="button"
            onClick={close}
            className="rounded-lg border border-border px-4 py-2 font-mono text-sm text-text-secondary hover:border-accent hover:text-accent"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
