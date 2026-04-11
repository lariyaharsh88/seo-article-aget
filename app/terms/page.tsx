import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-page";
import { SITE_NAME } from "@/lib/seo-site";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms of Service",
  description: `Terms of use for ${SITE_NAME} websites and tools: disclaimers, acceptable use, and limitations.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
        Legal
      </p>
      <h1 className="mt-3 font-display text-3xl text-text-primary md:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-2 font-mono text-xs text-text-muted">Last updated: April 2026</p>

      <div className="mt-10 space-y-6 font-serif text-sm leading-relaxed text-text-secondary [&_strong]:text-text-primary">
        <section>
          <h2 className="font-display text-xl text-text-primary">1. Agreement</h2>
          <p className="mt-2">
            By accessing or using <strong>{SITE_NAME}</strong> (“Service”), you agree to
            these Terms. If you disagree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-text-primary">2. Description</h2>
          <p className="mt-2">
            {SITE_NAME} provides web-based SEO and content tools. Features, availability,
            and limits may change. Some functions require valid third-party API keys or
            accounts configured by the site operator.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-text-primary">3. Acceptable use</h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Violate laws or third-party rights.</li>
            <li>Attempt to break, overload, or scrape the Service in ways that harm others.</li>
            <li>Use outputs to spam, defraud, or spread malware.</li>
            <li>Misrepresent AI-generated or automated content where disclosure is required.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl text-text-primary">4. Outputs and reliance</h2>
          <p className="mt-2">
            Generated text, scores, and suggestions may be inaccurate or outdated. You are
            responsible for fact-checking, editorial decisions, and compliance with search
            engine and advertising guidelines before publishing or building links.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-text-primary">5. Disclaimers</h2>
          <p className="mt-2">
            THE SERVICE IS PROVIDED “AS IS” WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
            IMPLIED. WE DO NOT GUARANTEE RANKINGS, TRAFFIC, OR REVENUE.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-text-primary">6. Limitation of liability</h2>
          <p className="mt-2">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, {SITE_NAME} AND ITS OPERATORS WILL NOT
            BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, OR
            LOST PROFITS OR DATA, ARISING FROM YOUR USE OF THE SERVICE.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-text-primary">7. Third parties</h2>
          <p className="mt-2">
            Links, ads, and embedded tools may lead to third-party sites. Their terms and
            privacy policies govern your use of those services.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-text-primary">8. Changes</h2>
          <p className="mt-2">
            We may modify these Terms or the Service. Material changes may be noted on this
            page. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-text-primary">9. Contact</h2>
          <p className="mt-2">
            For legal or operational questions, contact the site operator using the
            contact method they provide for {SITE_NAME}.
          </p>
        </section>
      </div>
    </main>
  );
}
