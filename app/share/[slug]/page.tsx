import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo-page";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return buildPageMetadata({
    title: "Redirecting article",
    description: "Redirecting to public article page.",
    path: `/share/${params.slug}`,
  });
}

export default async function SharedArticlePage({ params }: Props) {
  redirect(`/article/${params.slug}`);
}
