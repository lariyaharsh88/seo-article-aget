"use client";

import { useMemo, useState } from "react";
import { Card, CopyButton, inputCls, labelCls } from "@/components/free-tools/ui";

const YEAR = new Date().getFullYear();
type Style = "all" | "how" | "list" | "question" | "guide" | "compare";

function title(s: string): string {
  return s.replace(/(^|\s)([a-z])/g, (_, sp: string, c: string) => sp + c.toUpperCase());
}

function headlines(raw: string, audience: string): Array<{ text: string; style: Exclude<Style, "all"> }> {
  const k = raw.trim();
  if (!k) return [];
  const K = title(k);
  const a = audience.trim();
  const forA = a ? ` for ${a}` : "";
  const list: Array<{ text: string; style: Exclude<Style, "all"> }> = [
    { style: "how", text: `How to ${title(k.replace(/^how to\s+/i, ""))} (Step-by-Step)` },
    { style: "how", text: `How to Get Started With ${K}${forA}` },
    { style: "how", text: `How I Use ${K} to Save Hours Every Week` },
    { style: "how", text: `How to Choose the Right ${K} in ${YEAR}` },
    { style: "list", text: `10 ${K} Tips That Actually Work` },
    { style: "list", text: `7 Common ${K} Mistakes (and How to Avoid Them)` },
    { style: "list", text: `15 Best ${K} Ideas${forA}` },
    { style: "list", text: `5 Simple Ways to Improve Your ${K} Today` },
    { style: "list", text: `The 9 Best ${K} Tools in ${YEAR} (Tested)` },
    { style: "question", text: `What Is ${K}? Everything You Need to Know` },
    { style: "question", text: `Is ${K} Worth It? An Honest Look` },
    { style: "question", text: `Why ${K} Matters More Than You Think` },
    { style: "question", text: `Which ${K} Is Right for You?` },
    { style: "guide", text: `${K}: The Complete Guide (${YEAR})` },
    { style: "guide", text: `The Beginner's Guide to ${K}${forA}` },
    { style: "guide", text: `${K} Explained in Plain English` },
    { style: "guide", text: `${K} 101: A Quick Start Guide` },
    { style: "guide", text: `The Ultimate ${K} Checklist${forA}` },
    { style: "compare", text: `${K} vs the Alternatives: Which Should You Pick?` },
    { style: "compare", text: `Best ${K} Compared: Pros, Cons and Pricing` },
    { style: "compare", text: `${K}: Free vs Paid Options Compared` },
  ];
  return list.map((h) => ({ ...h, text: h.text.replace(/\s+/g, " ") }));
}

const STYLES: Array<[Style, string]> = [
  ["all", "All"],
  ["how", "How-to"],
  ["list", "Lists"],
  ["question", "Questions"],
  ["guide", "Guides"],
  ["compare", "Comparisons"],
];

export function HeadlineGeneratorTool() {
  const [keyword, setKeyword] = useState("email marketing");
  const [audience, setAudience] = useState("");
  const [style, setStyle] = useState<Style>("all");
  const all = useMemo(() => headlines(keyword, audience), [keyword, audience]);
  const shown = style === "all" ? all : all.filter((h) => h.style === style);

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>Topic or keyword</span>
            <input className={`${inputCls} mt-1`} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. email marketing" />
          </label>
          <label className="block">
            <span className={labelCls}>Audience (optional)</span>
            <input className={`${inputCls} mt-1`} value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. small businesses" />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {STYLES.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStyle(id)}
              className={`rounded-full border px-3 py-1 text-xs ${style === id ? "border-accent bg-accent text-background" : "border-border text-text-secondary hover:border-accent"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>
      {shown.length ? (
        <Card>
          <ul className="divide-y divide-border">
            {shown.map((h) => (
              <li key={h.text} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-sm text-text-primary">{h.text}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={`text-xs ${h.text.length > 60 ? "text-amber-400" : "text-text-muted"}`}>{h.text.length}</span>
                  <CopyButton text={h.text} />
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-text-muted">Numbers show characters — under ~60 fits in Google results.</p>
        </Card>
      ) : null}
    </div>
  );
}
