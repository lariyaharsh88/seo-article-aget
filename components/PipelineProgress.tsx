"use client";

import { useEffect, useState } from "react";
import type { PipelineStageDef } from "@/lib/pipeline-stages";

interface PipelineProgressProps {
  stages: PipelineStageDef[];
  currentStage: string | null;
  doneStages: string[];
}

export function PipelineProgress({
  stages,
  currentStage,
  doneStages,
}: PipelineProgressProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (currentStage || doneStages.length > 0) setVisible(true);
  }, [currentStage, doneStages.length]);

  return (
    <div
      className={`rounded-xl border border-border bg-surface/90 p-4 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
      aria-live="polite"
    >
      <h3 className="mb-3 font-mono text-xs uppercase tracking-wide text-text-muted">
        Pipeline
      </h3>
      <ul className="space-y-3">
        {stages.map((s) => {
          const done = doneStages.includes(s.id);
          const active = currentStage === s.id && !done;
          return (
            <li
              key={s.id}
              className="flex gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors duration-200 hover:border-border"
            >
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-sm text-background"
                style={{ backgroundColor: s.color }}
                aria-hidden
              >
                {done ? "✓" : active ? "•" : "○"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-text-primary">
                    {s.label}
                  </span>
                  {active && (
                    <span className="inline-flex gap-0.5" aria-label="In progress">
                      <span className="h-1 w-1 animate-pulse rounded-full bg-accent" />
                      <span
                        className="h-1 w-1 animate-pulse rounded-full bg-accent"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-1 w-1 animate-pulse rounded-full bg-accent"
                        style={{ animationDelay: "300ms" }}
                      />
                    </span>
                  )}
                </div>
                {active && (
                  <p className="mt-1 font-serif text-sm text-text-secondary">
                    {s.description}
                  </p>
                )}
                {!active && !done && (
                  <p className="mt-0.5 font-mono text-xs text-text-muted">
                    Pending
                  </p>
                )}
                {done && (
                  <p className="mt-0.5 font-mono text-xs text-success">Complete</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
