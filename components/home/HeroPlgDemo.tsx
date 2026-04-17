"use client";

import { useMemo, useState } from "react";
import { trackEvent, trackHeatmapTrigger } from "@/lib/analytics";

const STEPS = [
  "Great start - understanding your topic intent",
  "Nice momentum - shaping a clear structure",
  "Almost there - preparing your first preview",
] as const;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function HeroPlgDemo() {
  const [keyword, setKeyword] = useState("best ai seo tools for startups");
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [output, setOutput] = useState("");

  const progress = useMemo(() => (running ? Math.min(100, ((step + 1) / STEPS.length) * 100) : output ? 100 : 0), [running, step, output]);

  const runDemo = async () => {
    if (!keyword.trim() || running) return;
    trackEvent("feature_usage", {
      feature_name: "hero_instant_demo",
      action: "start",
      keyword_length: keyword.trim().length,
    });
    trackHeatmapTrigger("hero_demo_start", { page_path: "/" });
    setRunning(true);
    setStep(0);
    setOutput("");
    for (let i = 0; i < STEPS.length; i += 1) {
      setStep(i);
      await sleep(850);
    }
    setOutput(
      `# ${keyword.trim()} (2026 Guide)\n\n` +
        `## Quick answer\nUse a structured workflow: keyword intent, content depth, and internal linking.\n\n` +
        `## Why this ranks\n- Clear search intent match\n- Better heading structure\n- Stronger topical relevance`,
    );
    trackEvent("feature_usage", {
      feature_name: "hero_instant_demo",
      action: "complete",
      time_to_value_seconds: 3,
    });
    trackEvent("funnel_step", {
      funnel_name: "plg_try_without_signup",
      step_name: "instant_preview_ready",
      step_order: 2,
    });
    setRunning(false);
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-background/45 p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
        Interactive demo (no signup)
      </p>
      <p className="mt-2 font-serif text-sm text-text-secondary">
        Enter one keyword and see value in under 5 seconds.
      </p>
      <label className="mt-3 block">
        <span className="font-mono text-[11px] text-text-muted">Keyword</span>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-sm text-text-primary focus:border-accent focus:outline-none"
          placeholder="e.g. best ai seo tools"
          data-track-cta
          data-cta-label="hero_demo_keyword_input"
        />
      </label>
      <button
        type="button"
        onClick={() => void runDemo()}
        disabled={running}
        data-track-cta
        data-cta-label="hero_try_instant_demo"
        className="btn-premium mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-accent px-4 py-2 font-mono text-xs font-semibold text-background disabled:opacity-50"
      >
        {running ? "Building your first result..." : "Let's generate your first result"}
      </button>
      <div className="mt-3 h-1.5 w-full rounded-full bg-surface/80">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 font-mono text-[11px] text-text-muted">
        {running
          ? STEPS[step]
          : output
            ? "You're doing great - your preview is ready."
            : "Ready when you are. Your first win starts here."}
      </p>
      <div className="mt-3 min-h-[110px] rounded-lg border border-border/70 bg-surface/50 p-3">
        {output ? (
          <pre className="whitespace-pre-wrap font-serif text-xs leading-relaxed text-text-secondary">
            {output}
          </pre>
        ) : (
          <p className="font-serif text-xs text-text-muted">
            Your first sample output appears here. One click, one quick win.
          </p>
        )}
      </div>
    </div>
  );
}
