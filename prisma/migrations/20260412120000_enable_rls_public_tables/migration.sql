-- Satisfy Supabase Security Advisor: "RLS Disabled in Public"
-- Enables RLS on app tables. Prisma uses the Postgres pooler role, which bypasses RLS,
-- so Next.js + Prisma behaviour is unchanged. PostgREST (anon/authenticated) cannot read
-- these rows unless you add explicit policies later.
ALTER TABLE "VisibilityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PromptQuery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OptimizedContent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;
