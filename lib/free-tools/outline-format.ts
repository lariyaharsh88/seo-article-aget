/** Outline shape + Markdown export, shared by the API route and the browser tool. */
export type Outline = {
  keyword: string;
  title: string;
  sections: Array<{ h2: string; h3: string[] }>;
  faqs: string[];
  related: string[];
};

export function outlineToMarkdown(o: Outline): string {
  const lines = [`# ${o.title}`, ""];
  for (const s of o.sections) {
    lines.push(`## ${s.h2}`);
    for (const h of s.h3) lines.push(`### ${h}`);
    lines.push("");
  }
  if (o.faqs.length) {
    lines.push("## FAQ");
    for (const q of o.faqs) lines.push(`### ${q}`);
  }
  return lines.join("\n").trim();
}
