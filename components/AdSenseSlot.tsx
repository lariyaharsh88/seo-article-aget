"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT_ID } from "@/lib/adsense-config";

type AdSenseSlotProps = {
  /** Numeric slot ID from AdSense (same as `data-ad-slot`). */
  slot: string;
  className?: string;
  /** Wrapper only — keeps layout stable while the creative loads. */
  minHeight?: number;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  /** Maps to `data-full-width-responsive` (omit when false). */
  fullWidthResponsive?: boolean;
};

/**
 * Renders one AdSense display unit. The root layout already loads `adsbygoogle.js`;
 * this component pushes the unit after mount (required for React / Next.js).
 */
export function AdSenseSlot({
  slot,
  className,
  minHeight,
  format = "auto",
  fullWidthResponsive = true,
}: AdSenseSlotProps) {
  const insRef = useRef<HTMLModElement>(null);
  const filled = useRef(false);

  useEffect(() => {
    if (!slot || !ADSENSE_CLIENT_ID || !insRef.current || filled.current) {
      return;
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      filled.current = true;
    } catch {
      /* ignore — ad blockers or network */
    }
  }, [slot]);

  if (!ADSENSE_CLIENT_ID || !slot) {
    return null;
  }

  return (
    <div
      className={className}
      style={minHeight != null ? { minHeight } : undefined}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? "true" : undefined}
      />
    </div>
  );
}
