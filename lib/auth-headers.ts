/**
 * Auth headers for calls to our paid API routes (see lib/paid-route-guard.ts).
 * Browser: the signed-in Supabase session. Server (admin bulk pipelines): the internal token.
 */
export async function getApiAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === "undefined") {
    const secret =
      process.env.INTERNAL_API_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
    return secret ? { "x-internal-token": secret } : {};
  }
  try {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase-browser");
    const { data } = await getSupabaseBrowserClient().auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    // Supabase not configured — continue as guest.
    return {};
  }
}
