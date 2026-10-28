"use client";

import { useMemo, useState } from "react";
import {
  DESC_FONT,
  DESC_MAX_PX_DESKTOP,
  LengthMeter,
  SerpResult,
  TITLE_FONT,
  TITLE_MAX_PX,
  textWidth,
  useMeasureReady,
} from "@/components/free-tools/SerpPreview";
import { Card, CopyButton, inputCls, labelCls } from "@/components/free-tools/ui";

type PageType = "blog" | "product" | "service" | "local" | "home";

const YEAR = new Date().getFullYear();

function cap(s: string): string {
  return s.replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\b(And|Or|For|To|Of|In|On|With|The|A|An|Vs)\b/g, (m, w, i) =>
    i === 0 ? m : m.toLowerCase(),
  );
}

function generate(o: { keyword: string; brand: string; type: PageType; benefit: string; location: string }) {
  const k = o.keyword.trim();
  const K = cap(k);
  const b = o.brand.trim();
  const suffix = b ? ` | ${b}` : "";
  const benefit = o.benefit.trim().replace(/\.$/, "");
  const loc = o.location.trim();
  const titles: string[] = [];
  const descs: string[] = [];

  if (o.type === "blog") {
    titles.push(
      `${K}: The Complete Guide (${YEAR})${suffix}`,
      `What Is ${K}? A Simple Guide for Beginners${suffix}`,
      `${K}: 10 Tips That Actually Work${suffix}`,
      `How to Get Started With ${K} (Step by Step)`,
      `${K} Explained — Examples, Tips and Mistakes to Avoid`,
    );
    descs.push(
      `Learn everything about ${k}: what it is, how it works and how to get results. Practical steps, examples and tips${benefit ? ` — ${benefit}` : ""}.`,
      `New to ${k}? This guide explains the basics in plain English, with step-by-step instructions and the most common mistakes to avoid.`,
      `${K} made simple. See proven tips, real examples and a step-by-step plan you can follow today${b ? ` from ${b}` : ""}.`,
    );
  } else if (o.type === "product") {
    titles.push(
      `${K} — ${benefit ? cap(benefit) : "Shop Now"}${suffix}`,
      `Buy ${K} Online | Free Shipping${b ? ` | ${b}` : ""}`,
      `${K}: Best Price, Reviews & Fast Delivery${suffix}`,
      `Best ${K} for ${YEAR} — Compare & Save${suffix}`,
    );
    descs.push(
      `Shop ${k}${b ? ` at ${b}` : ""}. ${benefit ? `${cap(benefit)}. ` : ""}Compare models, read reviews and get fast delivery with easy returns.`,
      `Looking for ${k}? Find the best options, honest reviews and great prices. Order today and get it delivered fast.`,
    );
  } else if (o.type === "service") {
    titles.push(
      `${K} Services${b ? ` | ${b}` : ""}`,
      `Professional ${K} — ${benefit ? cap(benefit) : "Get a Free Quote"}${suffix}`,
      `${K} That Delivers Results | Free Consultation${b ? ` | ${b}` : ""}`,
    );
    descs.push(
      `Need ${k}? ${b || "Our team"} helps you ${benefit || "get results faster"}. See pricing, case studies and book a free consultation today.`,
      `Expert ${k} for businesses of every size. Transparent pricing, fast turnaround and a free consultation to get started.`,
    );
  } else if (o.type === "local") {
    const where = loc || "Your City";
    titles.push(
      `${K} in ${where}${suffix}`,
      `Best ${K} in ${where} — ${benefit ? cap(benefit) : "Call Today"}`,
      `${K} ${where} | Same-Day Service${b ? ` | ${b}` : ""}`,
    );
    descs.push(
      `Looking for ${k} in ${where}? ${b || "We"} offer${b ? "s" : ""} ${benefit || "fast, reliable service"} with upfront pricing. Call now or book online.`,
      `Trusted ${k} in ${where}. Licensed, insured and highly rated by local customers. Get a free quote today.`,
    );
  } else {
    titles.push(
      `${b || K} — ${K}${b ? "" : " Made Simple"}`,
      `${b ? `${b}: ` : ""}${K} ${benefit ? `to ${benefit}` : "for Everyone"}`,
      `${K} | ${b || "Official Site"}`,
    );
    descs.push(
      `${b || "We"} help${b ? "s" : ""} you with ${k}${benefit ? ` so you can ${benefit}` : ""}. Get started in minutes — see features, pricing and examples.`,
      `${b ? `${b} is ` : ""}the simple way to ${benefit || `handle ${k}`}. Trusted by teams and individuals. Try it free today.`,
    );
  }
  return {
    titles: Array.from(new Set(titles.map((t) => t.replace(/\s+/g, " ").trim()))),
    descs: Array.from(new Set(descs.map((d) => d.replace(/\s+/g, " ").trim()))),
  };
}

export function MetaTagGeneratorTool() {
  const [keyword, setKeyword] = useState("best crm for small business");
  const [brand, setBrand] = useState("");
  const [type, setType] = useState<PageType>("blog");
  const [benefit, setBenefit] = useState("");
  const [location, setLocation] = useState("");
  const [pickedTitle, setPickedTitle] = useState(0);
  const [pickedDesc, setPickedDesc] = useState(0);
  useMeasureReady();

  const out = useMemo(() => (keyword.trim() ? generate({ keyword, brand, type, benefit, location }) : { titles: [], descs: [] }), [
    keyword,
    brand,
    type,
    benefit,
    location,
  ]);
  const title = out.titles[pickedTitle] ?? out.titles[0] ?? "";
  const desc = out.descs[pickedDesc] ?? out.descs[0] ?? "";
  const htmlSnippet = title ? `<title>${title}</title>\n<meta name="description" content="${desc.replace(/"/g, "&quot;")}">` : "";

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelCls}>Main keyword</span>
            <input className={`${inputCls} mt-1`} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. best crm for small business" />
          </label>
          <label className="block">
            <span className={labelCls}>Page type</span>
            <select className={`${inputCls} mt-1`} value={type} onChange={(e) => setType(e.target.value as PageType)}>
              <option value="blog">Blog post / guide</option>
              <option value="product">Product page</option>
              <option value="service">Service page</option>
              <option value="local">Local business</option>
              <option value="home">Homepage</option>
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Brand name (optional)</span>
            <input className={`${inputCls} mt-1`} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Acme" />
          </label>
          <label className="block">
            <span className={labelCls}>Main benefit (optional)</span>
            <input className={`${inputCls} mt-1`} value={benefit} onChange={(e) => setBenefit(e.target.value)} placeholder="e.g. save 5 hours a week" />
          </label>
          {type === "local" ? (
            <label className="block">
              <span className={labelCls}>City / area</span>
              <input className={`${inputCls} mt-1`} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Austin, TX" />
            </label>
          ) : null}
        </div>
      </Card>

      {out.titles.length ? (
        <>
          <Card>
            <h2 className="font-display text-lg text-text-primary">Title ideas</h2>
            <ul className="mt-3 space-y-3">
              {out.titles.map((t, i) => (
                <li key={t} className={`rounded-xl border p-3 ${i === pickedTitle ? "border-accent/60 bg-accent/5" : "border-border"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" onClick={() => setPickedTitle(i)} className="text-left text-sm text-text-primary">
                      {t}
                    </button>
                    <CopyButton text={t} />
                  </div>
                  <LengthMeter px={textWidth(t, TITLE_FONT)} maxPx={TITLE_MAX_PX} chars={t.length} />
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="font-display text-lg text-text-primary">Meta description ideas</h2>
            <ul className="mt-3 space-y-3">
              {out.descs.map((d, i) => (
                <li key={d} className={`rounded-xl border p-3 ${i === pickedDesc ? "border-accent/60 bg-accent/5" : "border-border"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" onClick={() => setPickedDesc(i)} className="text-left text-sm text-text-primary">
                      {d}
                    </button>
                    <CopyButton text={d} />
                  </div>
                  <LengthMeter px={textWidth(d, DESC_FONT)} maxPx={DESC_MAX_PX_DESKTOP} chars={d.length} />
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-text-primary">Google preview</h2>
              <CopyButton text={htmlSnippet} label="Copy HTML" />
            </div>
            <p className="mt-1 text-sm text-text-muted">Click any title or description above to preview it.</p>
            <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-[#f8f9fa] p-3">
              <SerpResult title={title} url="https://example.com/page" description={desc} />
            </div>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-background p-3 text-xs text-text-secondary">{htmlSnippet}</pre>
          </Card>
        </>
      ) : null}
    </div>
  );
}
