"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import type { SeoMeta } from "@/lib/types";

interface SeoPackageProps {
  meta: SeoMeta | null;
  article: string;
}

async function copyText(text: string, onDone: () => void) {
  try {
    await navigator.clipboard.writeText(text);
    onDone();
  } catch {
    onDone();
  }
}

function CopyRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [ok, setOk] = useState(false);

  const onCopy = useCallback(() => {
    void copyText(value, () => {
      setOk(true);
      window.setTimeout(() => setOk(false), 1500);
    });
  }, [value]);

  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="font-mono text-xs uppercase text-text-muted">
          {label}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md border border-border px-2 py-1 font-mono text-xs text-accent transition-colors duration-200 hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {ok ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words font-serif text-sm text-text-primary">
        {value || "—"}
      </p>
    </div>
  );
}

export function SeoPackage({ meta, article }: SeoPackageProps) {
  const [fullOk, setFullOk] = useState(false);
  const [shareOk, setShareOk] = useState(false);
  const [publicLinkOk, setPublicLinkOk] = useState(false);
  const brandLine = "Powered by RankFlowHQ - rankflowhq.com";

  const onCopyFull = useCallback(() => {
    if (!meta) return;
    const pack = [
      `metaTitle: ${meta.metaTitle}`,
      `metaDescription: ${meta.metaDescription}`,
      `urlSlug: ${meta.urlSlug}`,
      `focusKeyword: ${meta.focusKeyword}`,
      `secondaryKeywords: ${meta.secondaryKeywords.join(", ")}`,
      `schemaType: ${meta.schemaType}`,
      `ogTitle: ${meta.ogTitle}`,
      `twitterDescription: ${meta.twitterDescription}`,
      `readabilityGrade: ${meta.readabilityGrade}`,
      `estimatedWordCount: ${meta.estimatedWordCount}`,
      "",
      "--- ARTICLE ---",
      article,
      "",
      brandLine,
    ].join("\n");
    void copyText(pack, () => {
      setFullOk(true);
      trackEvent("feature_usage", { feature_name: "seo_package", action: "copy_full_package" });
      window.setTimeout(() => setFullOk(false), 1500);
    });
  }, [meta, article, brandLine]);

  const onDownloadAndShare = useCallback(() => {
    if (!meta) return;
    const report = [
      "SEO REPORT SNAPSHOT",
      `Meta title: ${meta.metaTitle}`,
      `Meta description: ${meta.metaDescription}`,
      `Focus keyword: ${meta.focusKeyword}`,
      `Readability: ${meta.readabilityGrade}`,
      `Estimated words: ${meta.estimatedWordCount}`,
      "",
      "Why this matters:",
      "This report helps content, SEO, and growth teams align on the same execution brief.",
      "",
      `Watermark: ${brandLine}`,
      "Invite teammates to unlock advanced workflow templates.",
    ].join("\n");
    const fileBase =
      (meta.urlSlug || "seo-report").replace(/[^a-z0-9-]/gi, "").slice(0, 80) || "seo-report";
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileBase}-share-report.txt`;
    a.click();
    URL.revokeObjectURL(url);
    trackEvent("feature_usage", { feature_name: "seo_package", action: "download_share_report" });
    setShareOk(true);
    window.setTimeout(() => setShareOk(false), 1600);
  }, [brandLine, meta]);

  const onCopyPublicShareLink = useCallback(async () => {
    if (!meta) return;
    try {
      const shareMarkdown = [
        `# ${meta.metaTitle || "SEO report snapshot"}`,
        "",
        `Focus keyword: ${meta.focusKeyword}`,
        `Readability: ${meta.readabilityGrade}`,
        `Estimated words: ${meta.estimatedWordCount}`,
        "",
        brandLine,
      ].join("\n");
      const res = await fetch("/api/article-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: meta.metaTitle || "SEO report snapshot",
          markdown: shareMarkdown,
        }),
      });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      await navigator.clipboard.writeText(`${window.location.origin}${data.url}`);
      trackEvent("feature_usage", { feature_name: "seo_package", action: "copy_public_share_link" });
      setPublicLinkOk(true);
      window.setTimeout(() => setPublicLinkOk(false), 1600);
    } catch {
      setPublicLinkOk(false);
    }
  }, [brandLine, meta]);

  if (!meta) {
    return (
      <div className="rounded-xl border border-border/80 bg-surface/50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-accent/35 bg-accent/10 px-2.5 py-1.5 font-mono text-sm text-accent">
            SEO
          </div>
          <div>
            <p className="font-display text-lg text-text-primary">Your SEO package appears here</p>
            <p className="mt-1 font-serif text-sm text-text-secondary">
              Run one workflow to generate titles, descriptions, URL slug, and keyword guidance.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/seo-agent?try=1"
            className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 py-2 font-mono text-xs font-semibold text-background hover:opacity-90"
          >
            Generate SEO package now
          </Link>
          <Link
            href="/blog"
            className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
          >
            View sample outputs
          </Link>
        </div>
        <p className="mt-3 font-mono text-[11px] text-text-muted">
          Tip: use one clear primary keyword to get a faster first result.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <CopyRow label="Meta title" value={meta.metaTitle} />
        <CopyRow label="Meta description" value={meta.metaDescription} />
        <CopyRow label="URL slug" value={meta.urlSlug} />
        <CopyRow label="Focus keyword" value={meta.focusKeyword} />
        <CopyRow
          label="Secondary keywords"
          value={meta.secondaryKeywords.join(", ")}
        />
        <CopyRow label="OG title" value={meta.ogTitle} />
        <CopyRow label="Twitter description" value={meta.twitterDescription} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-purple/10 p-3">
          <p className="font-mono text-xs uppercase text-purple">Schema</p>
          <p className="mt-1 font-serif text-text-primary">{meta.schemaType}</p>
        </div>
        <div className="rounded-lg border border-border bg-info/10 p-3">
          <p className="font-mono text-xs uppercase text-info">Readability</p>
          <p className="mt-1 font-serif text-text-primary">
            {meta.readabilityGrade}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-success/10 p-3">
          <p className="font-mono text-xs uppercase text-success">Words (est.)</p>
          <p className="mt-1 font-serif text-text-primary">
            {meta.estimatedWordCount}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onCopyFull}
        className="w-full rounded-lg bg-accent px-4 py-3 font-mono text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {fullOk ? "✓ Full package copied" : "Copy full SEO package"}
      </button>
      <button
        type="button"
        onClick={onDownloadAndShare}
        className="w-full rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 font-mono text-sm font-semibold text-accent transition-colors duration-200 hover:bg-accent/20 focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {shareOk ? "✓ SEO report downloaded" : "Download SEO share report"}
      </button>
      <button
        type="button"
        onClick={() => void onCopyPublicShareLink()}
        className="w-full rounded-lg border border-border bg-background/80 px-4 py-3 font-mono text-sm font-semibold text-text-secondary transition-colors duration-200 hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {publicLinkOk ? "✓ Public link copied" : "Copy public SEO share link"}
      </button>
      <p className="font-mono text-[11px] text-text-muted">
        Every shared package includes Powered by RankFlowHQ branding and a built-in invite line.
      </p>
    </div>
  );
}
