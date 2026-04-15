"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buildEducationFunnelUrl } from "@/lib/education-funnel-url";
import { EDUCATION_HOSTS } from "@/lib/education-hosts";

const DISMISS_KEY_MAIN = "rankflowhq_exit_intent_dismissed";
const DISMISS_KEY_EDU = "rankflowhq_exit_intent_dismissed_education";

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const [isEducation, setIsEducation] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname.toLowerCase();
    const edu = EDUCATION_HOSTS.has(host);
    setIsEducation(edu);
    const dismissKey = edu ? DISMISS_KEY_EDU : DISMISS_KEY_MAIN;
    if (window.sessionStorage.getItem(dismissKey) === "1") return;

    function onMouseOut(event: MouseEvent) {
      if (event.relatedTarget) return;
      if (event.clientY > 10) return;
      setOpen(true);
      window.removeEventListener("mouseout", onMouseOut);
    }

    window.addEventListener("mouseout", onMouseOut);
    return () => window.removeEventListener("mouseout", onMouseOut);
  }, []);

  function close() {
    setOpen(false);
    if (typeof window === "undefined") return;
    const host = window.location.hostname.toLowerCase();
    const dismissKey = EDUCATION_HOSTS.has(host)
      ? DISMISS_KEY_EDU
      : DISMISS_KEY_MAIN;
    window.sessionStorage.setItem(dismissKey, "1");
  }

  if (!open) return null;

  const educationHref = buildEducationFunnelUrl(
    "/seo-agent",
    "exit_popup",
    typeof window !== "undefined" ? window.location.pathname : undefined,
  );

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/55 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
          Before you leave
        </p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">
          {isEducation
            ? "Create your own SEO article in 30 seconds"
            : "Get SEO article in 30 seconds"}
        </h2>
        <p className="mt-2 font-serif text-sm text-text-secondary">
          {isEducation
            ? "Jump to RankFlowHQ and turn a topic into a ranked, structured article with one workflow."
            : "Launch the full pipeline and generate an SEO-ready article now."}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={isEducation ? educationHref : "/seo-agent"}
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
