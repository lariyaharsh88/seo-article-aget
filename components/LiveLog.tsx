"use client";

import { useEffect, useRef } from "react";

interface LiveLogProps {
  lines: string[];
}

export function LiveLog({ lines }: LiveLogProps) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [lines]);

  return (
    <pre
      ref={ref}
      className="custom-scrollbar max-h-[420px] overflow-auto rounded-lg border border-border bg-background/80 p-3 font-mono text-xs leading-relaxed text-text-secondary"
      aria-live="polite"
    >
      {lines.length === 0
        ? "Logs appear here as the pipeline runs."
        : lines.join("\n")}
    </pre>
  );
}
