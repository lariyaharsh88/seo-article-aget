# RankFlowHQ

**RankFlowHQ** is a Next.js 14 (App Router) suite that turns a topic brief into keyword clusters, Tavily-backed research, SERP/PAA intelligence, a structured outline, a **streaming** Gemini article draft, and an SEO meta package you can copy in one click. API keys stay on the server (`/.env.local`) or travel only over request headers from the browser—nothing secret is embedded in client bundles.

## Free tier limits (indicative)

| Provider | Typical free tier | Notes |
| --- | --- | --- |
| Google Gemini 1.5 Flash | Generous dev quota via AI Studio | Rate limits vary by region/account |
| Tavily | Limited monthly searches on free plan | Deep (`advanced`) uses more quota |
| Serper.dev | ~2,500 free queries | Credit-based; check current pricing |

Always confirm limits on each provider’s pricing page before production use.

## Setup

1. **Clone or copy** this repo and open a terminal in the project root.
2. **Install dependencies:** `npm install`
3. **Environment file:** copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. **Add API keys** (anyone can still paste keys in the UI; server env is optional but handy on Vercel):
   - [Google AI Studio — Gemini](https://aistudio.google.com/apikey)
   - [Tavily](https://tavily.com/)
   - [Serper](https://serper.dev/)
5. **Run locally:** `npm run dev` then open [http://localhost:3000](http://localhost:3000).

Keys are never committed: `.env*.local` is gitignored. In the UI, keys are stored in `localStorage` and sent as `x-gemini-key`, `x-tavily-key`, and `x-serper-key` headers. If those headers are omitted, routes fall back to `GEMINI_API_KEY`, `TAVILY_API_KEY`, and `SERPER_API_KEY` from the environment (good for your own Vercel project).

## Deploy to Vercel

1. Push the repo to GitHub/GitLab and **Import** the project in [Vercel](https://vercel.com/).
2. Under **Settings → Environment Variables**, add:
   - `GEMINI_API_KEY`
   - `TAVILY_API_KEY`
   - `SERPER_API_KEY`
3. Deploy. The app detects server-side keys and enables **Run** without pasting into the browser (or you can still paste for multi-user demos).

## Estimated free usage per month

Rough order-of-magnitude for light personal use: **dozens** of full pipeline runs may stay within free tiers if you avoid huge concurrency; Tavily advanced searches and long Gemini outputs consume quota fastest. Monitor dashboards for each provider and add billing alerts if you scale up.

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — ESLint

## Project layout

See `app/api/*` for route handlers, `lib/*` for Gemini/Tavily/Serper helpers and types, and `components/*` for the editorial dark UI.
