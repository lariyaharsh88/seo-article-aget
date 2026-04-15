import type { Metadata } from "next";
import { getRequestMetadataBase } from "@/lib/request-site-origin";

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: await getRequestMetadataBase(),
  };
}

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
