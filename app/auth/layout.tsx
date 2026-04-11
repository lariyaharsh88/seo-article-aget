import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Do not index login or error pages. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
