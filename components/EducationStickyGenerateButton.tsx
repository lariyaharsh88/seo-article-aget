"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EDUCATION_HOSTS } from "@/lib/education-hosts";
import { buildEducationFunnelUrl } from "@/lib/education-funnel-url";

/**
 * Fixed CTA — only on education host — funnels to main SaaS with UTM tracking.
 */
export function EducationStickyGenerateButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const host = window.location.hostname.toLowerCase();
    setShow(EDUCATION_HOSTS.has(host));
  }, []);

  if (!show) return null;

  const href = buildEducationFunnelUrl("/seo-agent", "sticky_button");

  return (
    <Link
      href={href}
      className="fixed bottom-20 right-5 z-[60] rounded-full bg-accent px-4 py-2.5 font-mono text-xs text-background shadow-lg transition-opacity hover:opacity-90 sm:text-sm"
    >
      Generate Article
    </Link>
  );
}
