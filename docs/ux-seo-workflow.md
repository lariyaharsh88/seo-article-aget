# SEO workflow UX (Keyword → Article → Publish)

This document matches the in-app UX pass: simplified mental model, progress surfaces, content score, publish checklist, dashboard clarity, and CTAs.

## Wireframe descriptions

### A. Dashboard (`app/dashboard/page.tsx`)

- **Shell:** Max-width container; left **sticky nav** (Overview, Workflow, Quick actions, Recent activity, Usage stats) + **Latest run** card.
- **Overview header:** Eyebrow “Dashboard overview”, H1 “Manage your content workflow”, one-line value prop.
- **Workflow strip (`#workflow`):** Eyebrow “Simple workflow”, H2 “Keyword → Article → Publish”, **three equal cards** (numbered 1–3) with short copy for Keyword / Article / Publish, then primary CTA **Start in SEO agent** → `/seo-agent?try=1`.
- **Hero CTA (“Do this first”):** Accent panel with headline “Generate your next article” and **Generate article** button (same destination as workflow CTA).
- **Quick actions:** Grid of links (generate, cluster keywords, grader, pricing).
- **Empty state (no articles):** Dashed accent border, “Empty state” eyebrow, reassuring headline, explanation that runs populate the table, **Generate your first article** (primary) + **Plan keywords first** (secondary to clustering tool).
- **With data:** Stats row, **Recent activity** list with per-row metadata and link to generate another article.

### B. SEO Agent (`components/SeoAgentClient.tsx`)

- **Top:** Mode toggle (Quick Start / Advanced Setup), then **`WorkflowStepper`** — three horizontal steps (Keyword, Article, Publish) reflecting completion of brief, draft length, and meta title+description.
- **Main column:** Topic/input, pipeline controls, tabbed output (article, visual HTML, score, SEO, etc.).
  - Below the tab strip: **`ContentScoreStrip`** when an article exists and score is shown — overall score, **View breakdown** (switches to Score tab), **SEO package** (switches to SEO tab).
  - Contextual hint row under the strip; tab content below.
- **Right aside (desktop, `lg+`):** **`PipelineProgress`** (stage list) stacked above **`SeoPublishChecklist`** (publish-oriented checks derived from markdown + meta + optional score).
- **Mobile:** Same **`PipelineProgress`** and **`SeoPublishChecklist`** stacked in the main column (`lg:hidden`) so checklist is never desktop-only.

## Component structure (Next.js + Tailwind)

```
app/dashboard/page.tsx          # Page layout, nav anchors, workflow section, empty state, tables
app/seo-agent/page.tsx          # Route that renders SeoAgentClient

components/
  SeoAgentClient.tsx            # Orchestrates pipeline UI, tabs, score, aside/mobile checklist
  PipelineProgress.tsx          # Vertical stage progress (existing)
  workflow/
    WorkflowStepper.tsx         # 3-step Keyword → Article → Publish; props: *Complete booleans
    ContentScoreStrip.tsx       # Compact score + tab jumps; props: overall, visible, callbacks
    SeoPublishChecklist.tsx     # Checklist items; props: articleMarkdown, meta, hasKeywordBrief, contentScore?
  ArticleSeoScorecard.tsx       # Full/compact score breakdown (dynamic import in agent)
  SeoPackage.tsx                # Meta/SEO tab content (dynamic)
```

### Data flow (high level)

- **`WorkflowStepper`:** Driven by memoized flags in `SeoAgentClient` (e.g. brief present, article length threshold, meta fields filled).
- **`ContentScoreStrip`:** Uses `computeArticleSeoScore` / `seoScoreResult.overall`; visibility gated on article + `showSeoScore`.
- **`SeoPublishChecklist`:** Uses `buildPublishChecklistItems()` and `markdownToPlainText` from `lib/article-seo-score.ts` plus `SeoMeta` for title/description checks.

### Styling conventions

- Borders: `border-border/80`, surfaces `bg-surface/50`, accent CTAs `bg-accent text-background`.
- Responsive: dashboard `lg:grid-cols-[220px_1fr]`; agent main + aside `lg:grid-cols` with sticky aside; mobile-first duplication of aside widgets where needed.
