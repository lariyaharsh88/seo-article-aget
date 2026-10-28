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
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const brandLine = "Powered by RankFlowHQ - rankflowhq.com";

  const flash = useCallback((msg: string) => {
    setStatus(msg);
    window.setTimeout(() => setStatus(null), 2200);
  }, []);

  const copyMarkdown = useCallback(async () => {
    if (!markdown.trim()) return;
    try {
      await navigator.clipboard.writeText(`${markdown}\n\n${brandLine}`);
      trackEvent("feature_usage", { feature_name: "article_export", action: "copy_markdown" });
      flash("Article copied as Markdown");
    } catch {
      flash("Couldn't copy right now. Please try again.");
    }
  }, [markdown, flash]);

  const copyHtml = useCallback(async () => {
    if (!markdown.trim()) return;
    try {
      const html = `${markdownToArticleHtml(markdown)}\n<p>${brandLine}</p>`;
      await navigator.clipboard.writeText(html);
      trackEvent("feature_usage", { feature_name: "article_export", action: "copy_html" });
      flash("HTML copied and ready to paste");
    } catch {
      flash("Couldn't copy right now. Please try again.");
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
      flash(kind === "md" ? "Markdown downloaded" : "HTML downloaded");
    },
    [markdown, title, flash],
  );

  const fileBase = useCallback(
    () =>
      (title?.trim() || "generated-article")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 80) || "generated-article",
    [title],
  );

  const downloadDocx = useCallback(async () => {
    if (!markdown.trim()) return;
    try {
      const { markdownToDocxBlob } = await import("@/lib/export-docx");
      const blob = await markdownToDocxBlob(markdown, title?.trim() || "Generated article");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileBase()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      trackEvent("feature_usage", { feature_name: "article_export", action: "download_docx" });
      flash("Word file downloaded. Opens in Word or Google Docs (File → Open → Upload).");
    } catch {
      flash("Couldn't build the Word file. Please try again.");
    }
  }, [markdown, title, fileBase, flash]);

  /** PDF via the browser's print dialog ("Save as PDF") — keeps real text, links and headings. */
  const downloadPdf = useCallback(() => {
    if (!markdown.trim()) return;
    const win = window.open("", "_blank");
    if (!win) {
      flash("Allow pop-ups to save as PDF.");
      return;
    }
    const docTitle = (title?.trim() || "Generated article").replace(/</g, "&lt;");
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${docTitle}</title>
<style>
  body{font:12pt/1.6 Georgia,serif;color:#111;max-width:720px;margin:32px auto;padding:0 24px}
  h1,h2,h3,h4{font-family:Helvetica,Arial,sans-serif;line-height:1.25;page-break-after:avoid}
  h1{font-size:24pt}h2{font-size:17pt;margin-top:28px}h3{font-size:13pt}
  a{color:#1d4ed8}img{max-width:100%}table{border-collapse:collapse;width:100%;margin:12px 0}
  td,th{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:10.5pt}
  blockquote{border-left:3px solid #ccc;margin:0;padding-left:12px;color:#444}
  pre,code{font-family:Menlo,monospace;font-size:10pt}
  @page{margin:18mm}
</style></head><body>${markdownToArticleHtml(markdown)}</body></html>`);
    win.document.close();
    win.focus();
    win.onafterprint = () => win.close();
    window.setTimeout(() => win.print(), 300);
    trackEvent("feature_usage", { feature_name: "article_export", action: "download_pdf" });
  }, [markdown, title, flash]);

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
      const fullUrl = `${window.location.origin}${data.url}`;
      setShareUrl(fullUrl);
      await navigator.clipboard.writeText(fullUrl);
      trackEvent("feature_usage", { feature_name: "article_export", action: "share_public_link" });
      flash("Public link copied. You can share it now.");
      return fullUrl;
    } catch {
      flash("Couldn't create a share link. Please try again.");
      return null;
    }
  }, [markdown, title, flash]);

  const copyEmbedSnippet = useCallback(async () => {
    if (!markdown.trim()) return;
    try {
      const publicUrl = shareUrl || (await createShareLink());
      if (!publicUrl) {
        flash("Generate a public link first.");
        return;
      }
      const embed = [
        `<iframe src="${publicUrl}" width="100%" height="560" style="border:1px solid #d4d4d8;border-radius:12px;" loading="lazy"></iframe>`,
        `<p style="font-size:12px;color:#64748b;">Powered by <a href="https://rankflowhq.com?ref=embed" target="_blank" rel="noopener noreferrer">RankFlowHQ</a></p>`,
      ].join("\n");
      await navigator.clipboard.writeText(embed);
      trackEvent("feature_usage", { feature_name: "article_export", action: "copy_embed_snippet" });
      flash("Embed code copied");
    } catch {
      flash("Couldn't copy embed code. Please try again.");
    }
  }, [createShareLink, flash, markdown, shareUrl]);

  const copySocialShare = useCallback(async () => {
    if (!markdown.trim()) return;
    try {
      const publicUrl = shareUrl || (await createShareLink());
      if (!publicUrl) return;
      const socialText = [
        `Just generated an SEO-ready article in minutes: ${title?.trim() || "New SEO workflow output"}`,
        publicUrl,
        "",
        "Powered by RankFlowHQ",
        "Try it free: https://rankflowhq.com/seo-agent?try=1",
      ].join("\n");
      await navigator.clipboard.writeText(socialText);
      trackEvent("feature_usage", { feature_name: "article_export", action: "copy_social_share" });
      flash("Social caption copied");
    } catch {
      flash("Couldn't create social caption. Please try again.");
    }
  }, [createShareLink, flash, markdown, shareUrl, title]);

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
      `Try it: https://rankflowhq.com/seo-agent?try=1`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${base}-share-kit.txt`;
    a.click();
    URL.revokeObjectURL(url);
    trackEvent("feature_usage", { feature_name: "article_export", action: "download_share_kit" });
    flash("Share kit downloaded");
  }, [brandLine, flash, markdown, title]);

  const empty = !markdown.trim();

  return (
    <div className="mb-4 flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wide text-text-muted">
        Share & export
      </span>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <button
          type="button"
          onClick={() => void copyMarkdown()}
          disabled={disabled || empty}
          className="touch-manipulation w-full rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-1.5"
        >
          Copy article (Markdown)
        </button>
        <button
          type="button"
          onClick={() => void copyHtml()}
          disabled={disabled || empty}
          className="touch-manipulation w-full rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-1.5"
        >
          Copy article (HTML)
        </button>
        <button
          type="button"
          onClick={() => downloadFile("md")}
          disabled={disabled || empty}
          className="touch-manipulation w-full rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-1.5"
        >
          Download Markdown
        </button>
        <button
          type="button"
          onClick={() => downloadFile("html")}
          disabled={disabled || empty}
          className="touch-manipulation w-full rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-1.5"
        >
          Download HTML
        </button>
        <button
          type="button"
          onClick={() => void downloadDocx()}
          disabled={disabled || empty}
          className="touch-manipulation w-full rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-1.5"
        >
          Download Word (.docx)
        </button>
        <button
          type="button"
          onClick={downloadPdf}
          disabled={disabled || empty}
          className="touch-manipulation w-full rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-1.5"
        >
          Save as PDF
        </button>
        <button
          type="button"
          onClick={() => downloadShareKit()}
          disabled={disabled || empty}
          className="touch-manipulation w-full rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-1.5"
        >
          Download share kit
        </button>
        <button
          type="button"
          onClick={() => void createShareLink()}
          disabled={disabled || empty}
          className="touch-manipulation w-full rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-1.5"
        >
          Copy public link
        </button>
        <button
          type="button"
          onClick={() => void copyEmbedSnippet()}
          disabled={disabled || empty}
          className="touch-manipulation w-full rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-1.5"
        >
          Copy embed code
        </button>
        <button
          type="button"
          onClick={() => void copySocialShare()}
          disabled={disabled || empty}
          className="touch-manipulation w-full rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-1.5"
        >
          Copy social caption
        </button>
      </div>
      {shareUrl ? (
        <span className="w-full font-mono text-[11px] text-text-muted">
          Your public link is ready. Every share includes Powered by RankFlowHQ branding.
        </span>
      ) : null}
      {status ? (
        <span className="font-mono text-xs text-success" role="status">
          {status}
        </span>
      ) : null}
    </div>
  );
}
