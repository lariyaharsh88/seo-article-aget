-- Align existing news rows with feed source names (same lists as app sitemap sources).
UPDATE "EducationNewsArticle" SET "siteDomain" = 'education';

UPDATE "EducationNewsArticle" SET "siteDomain" = 'main'
WHERE "source" IN (
  'Ahrefs Blog',
  'SEJ RSS',
  'TechCrunch News Sitemap',
  'The Verge Entries',
  'SEJ News Sitemap',
  'SEOPress Posts',
  'Search Engine Land Posts',
  'SEJ Posts Sitemap',
  'Moz Blog Sitemap',
  'Moz Feed',
  'TechCrunch Feed'
);

-- Blog posts: education / exam topics → education (keyword heuristic on title, excerpt, start of body).
UPDATE "BlogPost"
SET "siteDomain" = 'education'
WHERE lower(coalesce("title", '') || ' ' || coalesce("excerpt", '') || ' ' || left(coalesce("content", ''), 12000))
  ~* '(education|edtech|exam|exams|examination|neet|jee|jee main|jee advanced|board|cbse|icse|student|school|college|university|admission|admissions|syllabus|upsc|nda|gate|cat|scholarship|campus|ugc|cutoff|result|semester|higher education|nep)';

-- Shared generated articles: same heuristic on title + markdown head.
UPDATE "SharedArticle"
SET "siteDomain" = 'education'
WHERE lower(coalesce("title", '') || ' ' || left(coalesce("markdown", ''), 8000))
  ~* '(education|edtech|exam|exams|examination|neet|jee|board|cbse|icse|student|school|college|university|admission|syllabus|upsc|nda|scholarship|campus|ugc|cutoff|result|higher education)';
