"use client";

import { useCallback, useState } from "react";
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
          {ok ? "✓ copied" : "Copy"}
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
    ].join("\n");
    void copyText(pack, () => {
      setFullOk(true);
      window.setTimeout(() => setFullOk(false), 1500);
    });
  }, [meta, article]);

  if (!meta) {
    return (
      <p className="font-serif text-text-secondary">
        Run the pipeline through the audit stage to generate the SEO package.
      </p>
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
        {fullOk ? "✓ Copied full package" : "Copy full package (meta + article)"}
      </button>
    </div>
  );
}
