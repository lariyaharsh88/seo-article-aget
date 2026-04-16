"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackEvent, trackHeatmapTrigger } from "@/lib/analytics";

const SCROLL_THRESHOLDS = [25, 50, 75, 90, 100] as const;

export function AnalyticsTracker() {
  const pathname = usePathname();
  const firedRef = useRef<Set<number>>(new Set());
  const pageStartRef = useRef<number>(Date.now());

  useEffect(() => {
    firedRef.current.clear();
    pageStartRef.current = Date.now();
    trackEvent("page_context_view", {
      page_path: pathname ?? "/",
    });
    trackHeatmapTrigger("page_view", { page_path: pathname ?? "/" });
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const clickable = target.closest("a,button") as HTMLElement | null;
      if (!clickable) return;

      const label = (
        clickable.getAttribute("data-cta-label") ||
        clickable.textContent ||
        clickable.getAttribute("aria-label") ||
        "unknown"
      )
        .trim()
        .slice(0, 120);
      if (!label) return;

      const href = clickable instanceof HTMLAnchorElement ? clickable.getAttribute("href") || "" : "";
      const isCta =
        clickable.hasAttribute("data-track-cta") ||
        clickable.className.includes("btn-premium");

      trackEvent(isCta ? "cta_click" : "ui_click", {
        page_path: pathname ?? "/",
        cta_label: label,
        destination: href || "none",
      });

      if (isCta) {
        trackHeatmapTrigger("cta_click", {
          page_path: pathname ?? "/",
          cta_label: label,
        });
      }
    };

    document.addEventListener("click", onClick, { passive: true });
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  useEffect(() => {
    const getDepth = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return 100;
      return Math.min(100, Math.round((scrollTop / docHeight) * 100));
    };

    const onScroll = () => {
      const depth = getDepth();
      for (const threshold of SCROLL_THRESHOLDS) {
        if (depth >= threshold && !firedRef.current.has(threshold)) {
          firedRef.current.add(threshold);
          trackEvent("scroll_depth", {
            page_path: pathname ?? "/",
            percent_scrolled: threshold,
          });
          if (threshold >= 75) {
            trackHeatmapTrigger("high_scroll_depth", {
              page_path: pathname ?? "/",
              percent_scrolled: threshold,
            });
          }
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      const engagedMs = Date.now() - pageStartRef.current;
      trackEvent("funnel_dropoff_signal", {
        page_path: pathname ?? "/",
        engaged_seconds: Math.round(engagedMs / 1000),
        max_scroll_depth: Math.max(0, ...Array.from(firedRef.current)),
      });
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [pathname]);

  return null;
}
