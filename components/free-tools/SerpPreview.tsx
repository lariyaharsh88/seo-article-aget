"use client";

import { useEffect, useState } from "react";
import { Card, inputCls, labelCls } from "@/components/free-tools/ui";

/** Google truncates by rendered width, not characters: ~600px titles, ~920px (desktop) descriptions. */
export const TITLE_MAX_PX = 600;
export const DESC_MAX_PX_DESKTOP = 920;
export const DESC_MAX_PX_MOBILE = 680;

let ctx: CanvasRenderingContext2D | null = null;
/**
 * Until the page has hydrated, every render (server and the browser's first pass) uses the same rough
 * estimate so the HTML matches; `useMeasureReady()` then switches to exact canvas measurement.
 */
let measureReady = false;
export function useMeasureReady(): void {
  const [, force] = useState(0);
  useEffect(() => {
    measureReady = true;
    force((n) => n + 1);
  }, []);
}
export function textWidth(text: string, font: string): number {
  const estimate = text.length * (font.startsWith("20px") ? 9.6 : 6.9);
  if (!measureReady || typeof document === "undefined") return estimate;
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return estimate;
  ctx.font = font;
  return ctx.measureText(text).width;
}
export const TITLE_FONT = "20px Arial";
export const DESC_FONT = "14px Arial";

/** Cut text so it fits maxPx, adding "…" like Google does. */
export function truncateToWidth(text: string, font: string, maxPx: number): { text: string; cut: boolean } {
  if (textWidth(text, font) <= maxPx) return { text, cut: false };
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (textWidth(`${text.slice(0, mid)}…`, font) <= maxPx) lo = mid;
    else hi = mid - 1;
  }
  const cut = text.slice(0, lo).replace(/\s+\S*$/, "");
  return { text: `${cut || text.slice(0, lo)} …`, cut: true };
}

function breadcrumb(url: string): { site: string; crumbs: string } {
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    const parts = u.pathname.split("/").filter(Boolean);
    return { site: u.hostname.replace(/^www\./, ""), crumbs: [u.origin, ...parts].join(" › ") };
  } catch {
    return { site: url || "example.com", crumbs: url || "https://example.com" };
  }
}

export function SerpResult(props: { title: string; url: string; description: string; mobile?: boolean }) {
  useMeasureReady();
  const t = truncateToWidth(props.title || "Your page title appears here", TITLE_FONT, TITLE_MAX_PX);
  const d = truncateToWidth(
    props.description || "Your meta description appears here. Write one or two sentences that explain the page and give a reason to click.",
    DESC_FONT,
    props.mobile ? DESC_MAX_PX_MOBILE : DESC_MAX_PX_DESKTOP,
  );
  const { site, crumbs } = breadcrumb(props.url);
  return (
    <div
      className={`rounded-xl bg-white p-4 text-left ${props.mobile ? "max-w-[380px]" : "max-w-[640px]"}`}
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1f3f4] text-xs text-[#5f6368]">
          {site.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[14px] text-[#202124]">{site}</p>
          <p className="truncate text-[12px] text-[#4d5156]">{crumbs}</p>
        </div>
      </div>
      <p className="mt-1.5 text-[20px] leading-[26px] text-[#1a0dab] hover:underline">{t.text}</p>
      <p className="mt-1 text-[14px] leading-[22px] text-[#4d5156]">{d.text}</p>
    </div>
  );
}

export function LengthMeter({ px, maxPx, chars }: { px: number; maxPx: number; chars: number }) {
  const pct = Math.min(100, (px / maxPx) * 100);
  const status = px > maxPx ? "text-red-400" : px < maxPx * 0.55 ? "text-amber-400" : "text-emerald-400";
  const bar = px > maxPx ? "bg-red-500" : px < maxPx * 0.55 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="mt-1.5">
      <div className="h-1.5 w-full rounded-full bg-border/60">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`mt-1 text-xs ${status}`}>
        {chars} characters · {Math.round(px)} / {maxPx}px{" "}
        {px > maxPx ? "— too long, Google will cut it" : px < maxPx * 0.55 ? "— could be longer" : "— good length"}
      </p>
    </div>
  );
}

export function SerpPreviewTool() {
  const [title, setTitle] = useState("Best CRM for Small Business (2026): 9 Tools Compared");
  const [url, setUrl] = useState("https://example.com/blog/best-crm-small-business");
  const [desc, setDesc] = useState(
    "We tested 9 CRMs for small teams on price, ease of use and integrations. See which one fits your business, with pros, cons and free plans.",
  );
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  useMeasureReady();
  const titlePx = textWidth(title, TITLE_FONT);
  const descPx = textWidth(desc, DESC_FONT);
  const descMax = device === "mobile" ? DESC_MAX_PX_MOBILE : DESC_MAX_PX_DESKTOP;

  return (
    <Card>
      <div className="grid gap-4">
        <label className="block">
          <span className={labelCls}>Page title</span>
          <input className={`${inputCls} mt-1`} value={title} onChange={(e) => setTitle(e.target.value)} />
          <LengthMeter px={titlePx} maxPx={TITLE_MAX_PX} chars={title.length} />
        </label>
        <label className="block">
          <span className={labelCls}>URL</span>
          <input className={`${inputCls} mt-1`} value={url} onChange={(e) => setUrl(e.target.value)} />
        </label>
        <label className="block">
          <span className={labelCls}>Meta description</span>
          <textarea className={`${inputCls} mt-1 h-24`} value={desc} onChange={(e) => setDesc(e.target.value)} />
          <LengthMeter px={descPx} maxPx={descMax} chars={desc.length} />
        </label>
      </div>
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-text-primary">Preview</p>
        <div className="inline-flex rounded-lg border border-border p-0.5">
          {(["desktop", "mobile"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className={`rounded-md px-3 py-1 text-xs capitalize ${device === d ? "bg-accent text-background" : "text-text-secondary"}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-[#f8f9fa] p-3">
        <SerpResult title={title} url={url} description={desc} mobile={device === "mobile"} />
      </div>
    </Card>
  );
}
