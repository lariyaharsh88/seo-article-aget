import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

function getUrlAndAnonKey(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return { url, key };
}

/**
 * Validates a Supabase access token and returns the user, or null.
 * Uses the anon key — safe for server routes; token must belong to a real session.
 */
export async function getSupabaseUserFromBearerToken(
  accessToken: string | undefined,
): Promise<User | null> {
  const t = accessToken?.trim();
  if (!t) return null;
  const cfg = getUrlAndAnonKey();
  if (!cfg) return null;

  const supabase = createClient(cfg.url, cfg.key);
  const { data, error } = await supabase.auth.getUser(t);
  if (error || !data.user) return null;
  return data.user;
}

export function getSupabaseUserFromRequest(request: Request): Promise<User | null> {
  const header = request.headers.get("authorization");
  const token = header?.replace(/^Bearer\s+/i, "").trim();
  return getSupabaseUserFromBearerToken(token);
}
