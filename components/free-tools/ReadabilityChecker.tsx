"use client";

import { useMemo, useState } from "react";
import { Card, Stat, StatusPill, inputCls, labelCls } from "@/components/free-tools/ui";
import { phraseCount, readingLabel, textStats, topTerms, words } from "@/lib/free-tools/text-stats";

const SAMPLE = `Email marketing is one of the cheapest ways to reach customers. You send a message straight to their inbox, so you do not depend on social media algorithms or paid ads.

To start, pick a tool that fits your budget and collect subscribers with a simple sign-up form on your website. Offer something useful in return, such as a checklist or a discount.

Then send one helpful email every week. Keep each message short, focus on one idea, and end with a clear next step. Track opens and clicks, and keep what works. Over a few months, a small list of people who trust you can bring steady sales.`;

export function ReadabilityCheckerTool() {
  const [text, setText] = useState(SAMPLE);
  const [keyword, setKeyword] = useState("email marketing");
  const s = useMemo(() => textStats(text), [text]);
  const terms = useMemo(() => topTerms(text, 12), [text]);
  const kwCount = useMemo(() => phraseCount(text, keyword), [text, keyword]);
  const kwWords = words(keyword).length || 1;
  const density = s.words ? ((kwCount * kwWords) / s.words) * 100 : 0;
  const firstPara = text.trim().split(/\n\s*\n/)[0] ?? "";
  const inIntro = keyword.trim() ? phraseCount(firstPara, keyword) > 0 : false;

  const checks: Array<{ label: string; status: "pass" | "warn" | "fail"; detail: string }> = [
    {
      label: "Reading ease",
      status: s.fleschReadingEase >= 60 ? "pass" : s.fleschReadingEase >= 45 ? "warn" : "fail",
      detail: `${s.fleschReadingEase.toFixed(0)}/100 — ${readingLabel(s.fleschReadingEase)}. Aim for 60+.`,
    },
    {
      label: "Grade level",
      status: s.fleschKincaidGrade <= 9 ? "pass" : s.fleschKincaidGrade <= 12 ? "warn" : "fail",
      detail: `About US grade ${s.fleschKincaidGrade.toFixed(1)}. Most web content reads best at grade 7–9.`,
    },
    {
      label: "Sentence length",
      status: s.avgWordsPerSentence <= 20 ? "pass" : s.avgWordsPerSentence <= 25 ? "warn" : "fail",
      detail: `${s.avgWordsPerSentence.toFixed(1)} words on average; ${s.longSentences} sentence(s) over 25 words.`,
    },
  ];
  if (keyword.trim()) {
    checks.push(
      {
        label: "Keyword density",
        status: density >= 0.5 && density <= 2.5 ? "pass" : density > 2.5 ? "fail" : "warn",
        detail: `"${keyword}" appears ${kwCount}× (${density.toFixed(2)}%). Around 0.5–2.5% reads naturally; more looks like stuffing.`,
      },
      {
        label: "Keyword in the first paragraph",
        status: inIntro ? "pass" : "warn",
        detail: inIntro ? "Yes — good, it tells readers and Google the topic early." : "Mention the keyword in your opening paragraph.",
      },
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <label className="block">
          <span className={labelCls}>Target keyword (optional)</span>
          <input className={`${inputCls} mt-1`} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </label>
        <label className="mt-4 block">
          <span className={labelCls}>Your text</span>
          <textarea className={`${inputCls} mt-1 h-56 font-serif`} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Reading ease" value={s.words ? s.fleschReadingEase.toFixed(0) : "—"} hint={s.words ? readingLabel(s.fleschReadingEase) : undefined} />
          <Stat label="Grade level" value={s.words ? s.fleschKincaidGrade.toFixed(1) : "—"} />
          <Stat label="Words" value={s.words} />
          <Stat label="Keyword density" value={keyword.trim() ? `${density.toFixed(2)}%` : "—"} />
        </div>
      </Card>
      {s.words ? (
        <Card>
          <h2 className="font-display text-lg text-text-primary">Checks</h2>
          <ul className="mt-3 space-y-2">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5">
                <StatusPill status={c.status} />
                <div>
                  <p className="text-sm font-medium text-text-primary">{c.label}</p>
                  <p className="text-sm text-text-secondary">{c.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          <h2 className="mt-6 font-display text-lg text-text-primary">Most used words</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {terms.map((t) => (
              <li key={t.term} className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary">
                {t.term} <span className="text-text-muted">· {t.count} · {t.density.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
