# MyCryptoSignal — frontend

The static site at **mycryptosignal.com**, built with [Astro](https://astro.build).

One brand, one design system: light/editorial default with a dark theme that follows the OS,
self-hosted **Inter** (UI, numbers) and **Newsreader** (headlines, body) fonts, and the
**Signal** mark — a pulse line with a single sharp peak.

## Pages

| Route | File | Notes |
|---|---|---|
| `/` | `src/pages/index.astro` | Market snapshot, movers, watchlist, latest news |
| `/signals` | `src/pages/signals/index.astro` | One direction per tracked coin |
| `/signals/[symbol]` | `src/pages/signals/[symbol].astro` | Coin page with an interactive chart (24H/7D/30D) |
| `/prices` | `src/pages/prices.astro` | Market heatmap + stacked table |
| `/news` | `src/pages/news/index.astro` | Attributed digests + our own market briefs |
| `/news/[slug]` | `src/pages/news/[slug].astro` | Article with `NewsArticle` JSON-LD + attribution |
| `/market/[date]` | `src/pages/market/[date].astro` | The daily market brief |
| `/api` | `src/pages/api.astro` | Overview, endpoints, tiers, quickstart |
| `/docs` | `src/pages/docs.astro` | Full API reference (auth, limits, shapes, errors) |
| `/get-access` | `src/pages/get-access.astro` | Instant, self-serve API key form |
| `/about`, `/contact` | `src/pages/{about,contact}.astro` | Company pages |
| `/terms`, `/privacy`, `/disclaimer`, `/disclosure`, `/copyright` | `src/pages/*.astro` | Legal |
| `/editorial-policy` | `src/pages/editorial-policy.astro` | Authorship, AI-assistance, corrections |
| `404` | `src/pages/404.astro` | Not-found page |
| `/feed.xml` | `src/pages/feed.xml.ts` | RSS, generated at build |
| `/sitemap.xml`, `/news-sitemap.xml` | `src/pages/*.xml.ts` | Sitemaps, generated at build |
| `/robots.txt`, `/manifest.json`, favicons | `public/` | Crawler + PWA assets |

## How it works

The site is a **fully static build**. It reads the public API **at build time** and ships plain
HTML — there are no client-side API calls, so the API base URL and read token are never exposed to
visitors. The live site is rebuilt and republished on a schedule.

## Build-time configuration (no secrets)

Two **public** env vars configure the build — never put a secret here:

| Var | Default | Purpose |
|---|---|---|
| `PUBLIC_API_BASE` | `https://api.mycryptosignal.workers.dev` | The public API host |
| `PUBLIC_API_KEY` | *(empty)* | Optional public read-only token for the site's own reads |

When the key is empty or the API has no data, every page renders a **graceful empty state**.

Copy `.env.example` → `.env` for local dev.

## Develop & build

```bash
npm install
npm run dev      # local dev server
npm run build    # static build → dist/
npm run preview  # preview the built site
```

## Design notes

- **Light is the default** (best for Google News + daylight reading); dark follows the OS and is
  user-toggleable, remembered in `localStorage`.
- **Fonts are self-hosted and subset** — no font CDN. Metric-matched fallbacks keep CLS at 0.
- **Tables become stacked cards at ≤640px** via `data-label` — no horizontal scroll at 320px.
- **Every data surface shows a real as-of timestamp.** The site never claims "live" or
  "real-time" data — prices are collected on a 30-minute schedule and baked in at build time.
- **Direction words only** — Rising / Falling / Steady / Choppy. No "buy", no "sell", no
  confidence percentages. "Data, not advice."

## License

MIT — see the repository root `LICENSE`. The data behind the site (the public API) is a separate,
operated service.
