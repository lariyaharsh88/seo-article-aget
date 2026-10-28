"use client";

import { useMemo, useState } from "react";
import { Card, Stat, inputCls } from "@/components/free-tools/ui";
import { formatMinutes, textStats } from "@/lib/free-tools/text-stats";

const TARGETS: Array<[string, number, number]> = [
  ["Meta description", 20, 30],
  ["Social post", 40, 100],
  ["Product description", 150, 300],
  ["Blog post", 1000, 1800],
  ["Pillar guide", 2500, 4000],
];

export function WordCounterTool() {
  const [text, setText] = useState("");
  const s = useMemo(() => textStats(text), [text]);

  return (
    <div className="space-y-4">
      <Card>
        <textarea
          className={`${inputCls} h-64 font-serif`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your text here…"
          aria-label="Text to count"
        />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Words" value={s.words.toLocaleString()} />
          <Stat label="Characters" value={s.characters.toLocaleString()} hint={`${s.charactersNoSpaces.toLocaleString()} without spaces`} />
          <Stat label="Sentences" value={s.sentences.toLocaleString()} />
          <Stat label="Paragraphs" value={s.paragraphs.toLocaleString()} />
          <Stat label="Reading time" value={s.words ? formatMinutes(s.readingMinutes) : "—"} hint="at 238 words/min" />
          <Stat label="Speaking time" value={s.words ? formatMinutes(s.speakingMinutes) : "—"} hint="at 140 words/min" />
          <Stat label="Words per sentence" value={s.words ? s.avgWordsPerSentence.toFixed(1) : "—"} hint="aim for under 20" />
          <Stat label="Long sentences" value={s.longSentences} hint="over 25 words" />
        </div>
      </Card>
      <Card>
        <h2 className="font-display text-lg text-text-primary">Typical lengths</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {TARGETS.map(([name, min, max]) => {
            const ok = s.words >= min && s.words <= max;
            return (
              <li key={name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-text-secondary">{name}</span>
                <span className={ok ? "font-semibold text-emerald-400" : "text-text-muted"}>
                  {min.toLocaleString()}–{max.toLocaleString()} words {ok ? "✓" : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
