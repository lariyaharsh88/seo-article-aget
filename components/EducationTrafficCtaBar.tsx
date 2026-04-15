"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buildEducationFunnelUrl } from "@/lib/education-funnel-url";
import { EDUCATION_HOSTS } from "@/lib/education-hosts";

/**
 * Lightweight host-aware promo bar shown only on education subdomain pages.
 * Keeps the main SaaS domain focused while funneling education traffic to it.
 */
export function EducationTrafficCtaBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const host = window.location.hostname.toLowerCase();
    setShow(EDUCATION_HOSTS.has(host));
  }, []);

  if (!show) return null;

  const href = buildEducationFunnelUrl("/seo-agent", "top_bar");

  return (
    <div className="border-b border-accent/30 bg-accent/10 px-4 py-2">
      <p className="mx-auto max-w-6xl text-center font-mono text-[11px] text-accent sm:text-xs">
        Create SEO-optimized articles like this{" "}
        <Link
          href={href}
          className="underline underline-offset-2 transition-opacity hover:opacity-80"
        >
          → Try RankFlowHQ
        </Link>
      </p>
    </div>
  );
}
