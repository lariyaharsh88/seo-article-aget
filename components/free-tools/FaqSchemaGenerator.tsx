"use client";

import { useMemo, useState } from "react";
import { Card, CopyButton, inputCls } from "@/components/free-tools/ui";

type Row = { q: string; a: string };

export function FaqSchemaGeneratorTool() {
  const [rows, setRows] = useState<Row[]>([
    { q: "What is FAQ schema?", a: "FAQ schema is structured data that tells search engines a page contains a list of questions and answers." },
    { q: "Where do I add the code?", a: "Paste the script into the page's HTML, inside the <head> or anywhere in the <body>." },
  ]);
  const valid = rows.filter((r) => r.q.trim() && r.a.trim());
  const json = useMemo(
    () =>
      JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: valid.map((r) => ({
            "@type": "Question",
            name: r.q.trim(),
            acceptedAnswer: { "@type": "Answer", text: r.a.trim() },
          })),
        },
        null,
        2,
      ),
    [valid],
  );
  const script = valid.length ? `<script type="application/ld+json">\n${json.replace(/<\//g, "<\\/")}\n</script>` : "";
  const update = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-4">
      <Card>
        <ul className="space-y-4">
          {rows.map((r, i) => (
            <li key={i} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-text-muted">Question {i + 1}</p>
                {rows.length > 1 ? (
                  <button type="button" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className="text-xs text-text-muted hover:text-red-400">
                    Remove
                  </button>
                ) : null}
              </div>
              <input className={`${inputCls} mt-2`} value={r.q} onChange={(e) => update(i, { q: e.target.value })} placeholder="Question" aria-label={`Question ${i + 1}`} />
              <textarea className={`${inputCls} mt-2 h-20`} value={r.a} onChange={(e) => update(i, { a: e.target.value })} placeholder="Answer" aria-label={`Answer ${i + 1}`} />
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setRows((rs) => [...rs, { q: "", a: "" }])}
          className="mt-4 rounded-lg border border-dashed border-border px-4 py-2 text-sm text-text-secondary hover:border-accent hover:text-accent"
        >
          + Add question
        </button>
      </Card>
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-text-primary">Your FAQ schema</h2>
          <CopyButton text={script} label="Copy code" />
        </div>
        <p className="mt-1 text-sm text-text-muted">
          {valid.length} question{valid.length === 1 ? "" : "s"} included. Test it with Google&apos;s Rich Results Test after publishing.
        </p>
        <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-background p-3 text-xs text-text-secondary">{script || "Add at least one question and answer."}</pre>
      </Card>
    </div>
  );
}
