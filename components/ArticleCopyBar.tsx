"use client";

import { useCallback, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { markdownToArticleHtml } from "@/lib/markdown-to-html";

interface ArticleCopyBarProps {
  markdown: string;
  title?: string;
  disabled?: boolean;
}

export function ArticleCopyBar({
  markdown,
  title,
  disabled,
}: ArticleCopyBarProps) {
  const [status, setStatus] = useState<string | null>(null);
  const brandLine = "Generated with RankFlowHQ - rankflowhq.com";

  const flash = useCallback((msg: string) => {
    setStatus(msg);
    window.setTimeout(() => setStatus(null), 2200);
  }, []);

  const copyMarkdown = useCallback(async () => {
    if (!markdown.trim()) return;
    try {
      await navigator.clipboard.writeText(`${markdown}\n\nGenerated with RankFlowHQ`);
      trackEvent("feature_usage", { feature_name: "article_export", action: "copy_markdown" });
      flash("Copied full article (Markdown)");
    } catch {
      flash("Copy failed — try HTTPS or allow clipboard");
    }
  }, [markdown, flash]);

  const copyHtml = useCallback(async () => {
    if (!markdown.trim()) return;
    try {
      const html = `${markdownToArticleHtml(markdown)}\n<p>${brandLine}</p>`;
      await navigator.clipboard.writeText(html);
      trackEvent("feature_usage", { feature_name: "article_export", action: "copy_html" });
      flash("Copied HTML (tables, headings, lists)");
    } catch {
      flash("Copy failed — try HTTPS or allow clipboard");
    }
  }, [markdown, flash]);

  const downloadFile = useCallback(
    (kind: "md" | "html") => {
      if (!markdown.trim()) return;
      const base = (title?.trim() || "generated-article")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 80) || "generated-article";
      const text =
        kind === "md"
          ? `${markdown}\n\n${brandLine}`
          : `${markdownToArticleHtml(markdown)}\n<p>${brandLine}</p>`;
      const blob = new Blob([text], {
        type: kind === "md" ? "text/markdown;charset=utf-8" : "text/html;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}.${kind}`;
      a.click();
      URL.revokeObjectURL(url);
      trackEvent("feature_usage", { feature_name: "article_export", action: `download_${kind}` });
      flash(kind === "md" ? "Downloaded Markdown" : "Downloaded HTML");
    },
    [markdown, title, flash],
  );

  const createShareLink = useCallback(async () => {
    if (!markdown.trim()) return;
    try {
      const res = await fetch("/api/article-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title?.trim() || "Generated article",
          markdown,
        }),
      });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      await navigator.clipboard.writeText(`${window.location.origin}${data.url}`);
      trackEvent("feature_usage", { feature_name: "article_export", action: "share_public_link" });
      flash("Public share link copied");
    } catch {
      flash("Share failed — try again");
    }
  }, [markdown, title, flash]);

  const downloadShareKit = useCallback(() => {
    if (!markdown.trim()) return;
    const base = (title?.trim() || "generated-article")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || "generated-article";
    const preview = markdown
      .replace(/^#+\s+/gm, "")
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .slice(0, 8)
      .join("\n");
    const text =
      `SEO RESULT SNAPSHOT\n` +
      `Title: ${title?.trim() || "Generated article"}\n\n` +
      `${preview}\n\n` +
      `---\n${brandLine}\n` +
      `Invite teammates and unlock advanced workflow templates.`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${base}-share-kit.txt`;
    a.click();
    URL.revokeObjectURL(url);
    trackEvent("feature_usage", { feature_name: "article_export", action: "download_share_kit" });
    flash("Downloaded branded share kit");
  }, [brandLine, flash, markdown, title]);

  const empty = !markdown.trim();

  return (
    <div className="mb-4 flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wide text-text-muted">
        Export
      </span>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <button
          type="button"
          onClick={() => void copyMarkdown()}
          disabled={disabled || empty}
          className="touch-manipulation w-full rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-1.5"
        >
          Copy Markdown
        </button>
        <button
          type="button"
          onClick={() => void copyHtml()}
          disabled={disabled || empty}
          className="touch-manipulation w-full rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-1.5"
        >
          Copy HTML
        </button>
        <button
          type="button"
          onClick={() => downloadFile("md")}
          disabled={disabled || empty}
          className="touch-manipulation w-full rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-1.5"
        >
          Export Markdown
        </button>
        <button
          type="button"
          onClick={() => downloadFile("html")}
          disabled={disabled || empty}
          className="touch-manipulation w-full rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-1.5"
        >
          Export HTML
        </button>
        <button
          type="button"
          onClick={() => downloadShareKit()}
          disabled={disabled || empty}
          className="touch-manipulation w-full rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-1.5"
        >
          Download & Share
        </button>
        <button
          type="button"
          onClick={() => void createShareLink()}
          disabled={disabled || empty}
          className="touch-manipulation w-full rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-1.5"
        >
          Share Public Link
        </button>
      </div>
      {status ? (
        <span className="font-mono text-xs text-success" role="status">
          {status}
        </span>
      ) : null}
    </div>
  );
}
