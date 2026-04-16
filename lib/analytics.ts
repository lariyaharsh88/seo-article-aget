"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    hj?: (...args: unknown[]) => void;
  }
}

type EventParams = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(eventName: string, params: EventParams = {}) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", eventName, params);
}

export function trackHeatmapTrigger(triggerName: string, params: EventParams = {}) {
  if (typeof window === "undefined") return;
  window.hj?.("event", triggerName);
  window.gtag?.("event", "heatmap_trigger", {
    trigger_name: triggerName,
    ...params,
  });
}
