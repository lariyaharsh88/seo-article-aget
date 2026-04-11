import Link from "next/link";

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const denied = searchParams.error === "AccessDenied";

  return (
    <main className="mx-auto max-w-md px-4 py-16 md:px-6">
      <h1 className="font-display text-2xl text-text-primary">
        {denied ? "Access denied" : "Sign-in error"}
      </h1>
      <p className="mt-3 font-serif text-sm text-text-secondary">
        {denied
          ? "You are not allowed to sign in with this account."
          : "Something went wrong during sign-in. Try again."}
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
