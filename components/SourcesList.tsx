"use client";

import type { Source } from "@/lib/types";

interface SourcesListProps {
  sources: Source[];
}

export function SourcesList({ sources }: SourcesListProps) {
  if (sources.length === 0) {
    return (
      <p className="font-serif text-text-secondary">
        Sources will appear after the research stage completes.
      </p>
    );
  }

  return (
    <ol className="list-decimal space-y-4 pl-6">
      {sources.map((s) => (
        <li key={s.url} className="font-serif">
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-info underline-offset-2 transition-colors duration-200 hover:text-accent hover:underline"
          >
            {s.title || s.url}
          </a>
          <p className="mt-1 text-sm text-text-secondary">{s.snippet}</p>
          <p className="mt-1 font-mono text-xs text-text-muted break-all">
            {s.url}
          </p>
        </li>
      ))}
    </ol>
  );
}
