import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/seo-site";

/** Do not index login or error pages; still set a clear title for tabs and password managers. */
export const metadata: Metadata = {
  title: "Sign in",
  description: `Secure sign-in for ${SITE_NAME} blog administration. This area is not shown in search results.`,
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
