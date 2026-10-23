import { ImageResponse } from "next/og";

/**
 * Branded image card, rendered on our own server — free, no third-party limits.
 * Used as the fallback section image in generated articles and as the default
 * social/OG image for articles. Lives outside /api/ so robots.txt allows crawlers.
 *
 *   /og/card?title=...&kicker=...&w=1200&h=630&v=0..4
 */
export const runtime = "edge";

const PALETTES = [
  { bg: "#FAF8F5", ink: "#16181D", accent: "#0F8A5F", soft: "#E3F1EA" },
  { bg: "#F4F7F5", ink: "#13201A", accent: "#0F8A5F", soft: "#D8EDE2" },
  { bg: "#FBF6EE", ink: "#1E1A16", accent: "#B45309", soft: "#F5E6CF" },
  { bg: "#F3F5FA", ink: "#141824", accent: "#3B5BDB", soft: "#DDE4F7" },
  { bg: "#F8F4F8", ink: "#1C1520", accent: "#9C36B5", soft: "#EEDDF1" },
] as const;

function clampText(s: string | null, max: number, fallback: string): string {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  if (!t) return fallback;
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).trimEnd()}…`;
}

/** Plus Jakarta Sans 800 (site heading font) as WOFF — Satori reads WOFF/TTF, not WOFF2. Cached per instance. */
const FONT_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/plus-jakarta-sans@5/files/plus-jakarta-sans-latin-800-normal.woff";
let fontPromise: Promise<ArrayBuffer | null> | null = null;
function loadFont(): Promise<ArrayBuffer | null> {
  fontPromise ??= fetch(FONT_URL)
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .catch(() => null);
  return fontPromise;
}

export async function GET(request: Request) {
  const font = await loadFont();
  const q = new URL(request.url).searchParams;
  const title = clampText(q.get("title"), 110, "RankFlowHQ");
  const kicker = clampText(q.get("kicker"), 60, "");
  const w = Math.min(1600, Math.max(400, Number(q.get("w")) || 1200));
  const h = Math.min(1000, Math.max(300, Number(q.get("h")) || 630));
  const p = PALETTES[Math.abs(Number(q.get("v")) || 0) % PALETTES.length];
  const scale = w / 1200;
  const fontSize = Math.round((title.length > 70 ? 54 : title.length > 40 ? 64 : 76) * scale);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: p.bg,
          padding: `${Math.round(72 * scale)}px ${Math.round(80 * scale)}px`,
          fontFamily: "Jakarta, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -120 * scale,
            top: -120 * scale,
            width: 520 * scale,
            height: 520 * scale,
            borderRadius: 9999,
            background: p.soft,
            display: "flex",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 16 * scale }}>
          <div style={{ width: 14 * scale, height: 56 * scale, background: p.accent, borderRadius: 6, display: "flex" }} />
          {kicker ? (
            <div style={{ fontSize: Math.round(30 * scale), color: p.accent, fontWeight: 700, display: "flex" }}>
              {kicker}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            fontSize,
            lineHeight: 1.12,
            fontWeight: 800,
            color: p.ink,
            letterSpacing: "-0.02em",
            maxWidth: "92%",
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", fontSize: Math.round(28 * scale), color: p.ink, opacity: 0.6, fontWeight: 600 }}>
          rankflowhq.com
        </div>
      </div>
    ),
    {
      width: w,
      height: h,
      ...(font ? { fonts: [{ name: "Jakarta", data: font, weight: 800 as const, style: "normal" as const }] } : {}),
      headers: { "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable" },
    },
  );
}
