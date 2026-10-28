-- Lock down tables created after 20260412120000_enable_rls_public_tables.
-- Supabase exposes the public schema through PostgREST with the anon key (shipped to browsers);
-- with RLS on and no policies, only the table owner (Prisma's connection) can read or write.
ALTER TABLE "ArticleKeyword" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ArticleEmbedding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InternalLinkSuggestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DistributionBatch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeoFeedbackSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UsageCounter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PublishConnection" ENABLE ROW LEVEL SECURITY;
