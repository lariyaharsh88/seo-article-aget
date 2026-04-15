-- Product decision: only education news stays on education subdomain.
-- Blogs and shared article pages must always resolve to main domain.

UPDATE "BlogPost"
SET "siteDomain" = 'main'
WHERE "siteDomain" <> 'main';

UPDATE "SharedArticle"
SET "siteDomain" = 'main'
WHERE "siteDomain" <> 'main';
