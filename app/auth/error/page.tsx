import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/seo-site";

export const metadata: Metadata = {
  title: "Sign-in error",
  description: `Sign-in could not complete on ${SITE_NAME}. Check configuration or credentials, then try again (not indexed).`,
  robots: { index: false, follow: false },
};

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const code = searchParams.error;
  const denied = code === "AccessDenied";
  const configuration = code === "Configuration";

  return (
    <main className="mx-auto min-w-0 max-w-md px-4 py-12 sm:py-16 md:px-6">
      <h1 className="font-display text-2xl text-text-primary">
        {configuration
          ? "Auth not configured"
          : denied
            ? "Access denied"
            : "Sign-in error"}
      </h1>
      <p className="mt-3 break-words font-serif text-sm text-text-secondary">
        {configuration ? (
          <>
            The server is missing NextAuth environment variables (usually{" "}
            <code className="font-mono text-xs text-accent">NEXTAUTH_SECRET</code>{" "}
            and{" "}
            <code className="font-mono text-xs text-accent">NEXTAUTH_URL</code>
            ). Add them in Vercel → Project → Settings → Environment Variables,
            then redeploy.{" "}
            <code className="font-mono text-xs text-accent">NEXTAUTH_URL</code> must
            match this site exactly (e.g.{" "}
            <code className="font-mono text-xs text-accent">
              https://rankflowhq.com
            </code>
            — same as <code className="font-mono text-xs">www</code> or not).
          </>
        ) : denied ? (
          "Wrong email or password, or this account is not allowed."
        ) : (
          "Something went wrong during sign-in. Try again."
        )}
      </p>
      <Link
        href="/auth/signin"
        className="mt-8 inline-block rounded-lg border border-border px-4 py-2 font-mono text-xs text-accent hover:bg-accent/10"
      >
        Back to sign in
      </Link>
    </main>
  );
}
