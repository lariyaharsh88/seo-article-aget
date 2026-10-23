"use client";

import dynamic from "next/dynamic";

const SiteChatWidget = dynamic(
  () => import("@/components/SiteChatWidget").then((m) => m.SiteChatWidget),
  { ssr: false },
);
const EducationStickyGenerateButton = dynamic(
  () =>
    import("@/components/EducationStickyGenerateButton").then(
      (m) => m.EducationStickyGenerateButton,
    ),
  { ssr: false },
);
const MainMobileStickyCta = dynamic(
  () => import("@/components/MainMobileStickyCta").then((m) => m.MainMobileStickyCta),
  { ssr: false },
);

export function LazyUiWidgets() {
  return (
    <>
      <SiteChatWidget />
      <EducationStickyGenerateButton />
      <MainMobileStickyCta />
    </>
  );
}
