-- Profiles for Supabase Auth users (stored in app DB; not Supabase auth.users).
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserProfile_supabaseUserId_key" ON "UserProfile"("supabaseUserId");

-- Same pattern as other app tables: RLS on for Supabase advisor; Prisma pooler bypasses RLS.
ALTER TABLE "UserProfile" ENABLE ROW LEVEL SECURITY;
