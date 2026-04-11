import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo-site";

const W = 1200;
const H = 630;

/** 1200×630 PNG for Open Graph / news hero (uploaded to Blob + CDN). */
export async function getNewsHeroImageBuffer(title: string): Promise<Buffer> {
  const displayTitle = title.trim().slice(0, 180) || "News";

  const res = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(145deg,#0c0f14 0%,#151b24 55%,#0f1419 100%)",
          padding: 72,
        }}
      >
        <span
          style={{
            fontSize: displayTitle.length > 90 ? 44 : 52,
            fontWeight: 700,
            color: "#e8eef7",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxHeight: 360,
            overflow: "hidden",
          }}
        >
          {displayTitle}
        </span>
        <span
          style={{
            marginTop: 36,
            fontSize: 26,
            fontWeight: 600,
            color: "#7dd3c0",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {SITE_NAME} News
        </span>
      </div>
    ),
    { width: W, height: H },
  );

  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
