"use client";

import { useCallback, useMemo, useState } from "react";

type Props = {
  title: string;
  url: string;
};

export function PublicArticleShareBar({ title, url }: Props) {
  const [status, setStatus] = useState<string | null>(null);

  const encodedTitle = useMemo(() => encodeURIComponent(title), [title]);
  const encodedUrl = useMemo(() => encodeURIComponent(url), [url]);

  const flash = useCallback((message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(null), 2000);
  }, []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      flash("Link copied");
    } catch {
      flash("Copy failed");
    }
  }, [url, flash]);

  return (
    <div className="mt-4 rounded-lg border border-border bg-background/70 p-3">
      <p className="font-mono text-[10px] uppercase tracking-wide text-text-muted">
        Share this article
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="rounded-md border border-border px-3 py-1.5 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
        >
          Copy Link
        </button>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-border px-3 py-1.5 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
        >
          Share on X
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-border px-3 py-1.5 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
        >
          Share on LinkedIn
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-border px-3 py-1.5 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
        >
          Share on Facebook
        </a>
      </div>
      {status ? (
        <p role="status" className="mt-2 font-mono text-xs text-success">
          {status}
        </p>
      ) : null}
    </div>
  );
}

