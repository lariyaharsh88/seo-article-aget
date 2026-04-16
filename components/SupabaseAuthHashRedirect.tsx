"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Some Supabase email links use **Site URL** as the landing page and put tokens in the
 * URL hash on `/` (e.g. `/#access_token=...`). Forward to `/auth/callback` so the session
 * is established and we redirect to the app.
 */
export function SupabaseAuthHashRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname?.startsWith("/auth/callback")) return;

    const hash = window.location.hash;
    if (
      !hash ||
      (!hash.includes("access_token") &&
        !hash.includes("error") &&
        !hash.includes("refresh_token"))
    ) {
      return;
    }

    const next = "/seo-agent";
    window.location.replace(
      `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}${hash}`,
    );
  }, [pathname]);

  return null;
}
