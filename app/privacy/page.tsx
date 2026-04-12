import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildStaticWebPageSchema } from "@/lib/schema-org";
import { SITE_NAME } from "@/lib/seo-site";

const PRIVACY_DESC = `RankFlowHQ Privacy Policy: what we collect when you use our tools, Google Analytics 4 and AdSense, cookies, and your privacy choices—plain-language summary.`;

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy — Analytics, Ads & Data",
  description: PRIVACY_DESC,
  path: "/privacy",
  keywords: ["privacy policy", "RankFlowHQ privacy", "Google Analytics", "AdSense"],
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={buildStaticWebPageSchema({
          path: "/privacy",
          name: "Privacy Policy",
          description: PRIVACY_DESC,
          breadcrumb: [
            { name: "Home", path: "/" },
            { name: "Privacy Policy", path: "/privacy" },
          ],
        })}
      />
    <main className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
        Legal
      </p>
      <h1 className="mt-3 font-display text-3xl text-text-primary md:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 font-mono text-xs text-text-muted">Last updated: April 2026</p>

      <div className="mt-10 space-y-6 font-serif text-sm leading-relaxed text-text-secondary [&_strong]:text-text-primary">
        <section>
          <h2 className="font-display text-xl text-text-primary">1. Who we are</h2>
          <p className="mt-2">
            This policy describes how <strong>{SITE_NAME}</strong> (“we”, “us”) handles
            information when you use our website and tools at the domain where this
            policy is published.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-text-primary">2. Information we collect</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong>Usage and analytics.</strong> We use Google Analytics 4 (GA4) to
              understand traffic, pages viewed, and similar metrics. Google’s terms and
              privacy policy also apply.
            </li>
            <li>
              <strong>Advertising.</strong> We may use Google AdSense to show ads. Google
              may use cookies or similar technologies to serve personalized or
              non-personalized ads, subject to your settings and applicable law.
            </li>
            <li>
              <strong>Content you submit.</strong> When you use tools (e.g. topics,
              domains, keywords), that input is processed to generate results. Do not
              submit secrets, passwords, or highly sensitive personal data unless the tool
              explicitly requires it.
            </li>
            <li>
              <strong>Server logs.</strong> Hosting providers may log IP addresses,
              user agents, and timestamps for security and operations.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl text-text-primary">3. Cookies</h2>
          <p className="mt-2">
            We and our partners may set cookies or use local storage for analytics,
            advertising, and site functionality. You can control cookies through your
            browser settings and, where offered, consent or ad personalization controls.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-text-primary">4. Third-party services</h2>
          <p className="mt-2">
            Features may call third-party APIs (for example AI, search, or data
            providers) using keys configured by the site operator. Those providers
            process data under their own terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-text-primary">5. Retention</h2>
          <p className="mt-2">
            Analytics and ad data are retained according to Google’s settings for your
            property. Operational logs depend on hosting configuration.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-text-primary">6. Your choices</h2>
          <p className="mt-2">
            Depending on your region, you may have rights to access, correct, or delete
            personal data, or to object to certain processing. For GA/Ads, you may also
            use browser add-ons or platform opt-out tools where available.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-text-primary">7. Children</h2>
          <p className="mt-2">
            {SITE_NAME} is not directed at children under 13 (or the age required in your
            jurisdiction). We do not knowingly collect their personal information.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-text-primary">8. Changes</h2>
          <p className="mt-2">
            We may update this policy from time to time. Continued use after changes
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-text-primary">9. Contact</h2>
          <p className="mt-2">
            For privacy requests, contact the operator of this site at the administrative
            email or address they publish for {SITE_NAME}.
          </p>
        </section>
      </div>
    </main>
    </>
  );
}
