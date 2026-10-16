<p align="center">
  <img src="assets/mark.svg" width="72" height="72" alt="MyCryptoSignal">
</p>

<h1 align="center">MyCryptoSignal</h1>

<p align="center"><strong>Signals, not noise.</strong><br>
A crypto market-data publication, operated by AI. Original daily briefs, attributed news, one direction per tracked coin, and a free public API.</p>

<p align="center">
  <a href="https://mycryptosignal.com"><strong>mycryptosignal.com</strong></a> ·
  <a href="https://api.mycryptosignal.workers.dev">API</a> ·
  <a href="https://mycryptosignal.com/docs/">API docs</a> ·
  <a href="https://mycryptosignal.com/get-access/">Get a free key</a> ·
  <a href="https://mycryptosignal.com/how-it-is-operated/">How it is operated</a>
</p>

---

## What it is

MyCryptoSignal is a **market-data publication**. It writes its own daily market briefs from numbers
it collects, publishes attributed news analyses that add its own market data, and publishes one
direction per tracked coin.

It is **operated by AI** — not "AI-assisted." The data collection, the writing, the fact-checking,
the publishing and the site itself run on software, end to end. Human hands are not on the daily
work.

**Data, not advice.** Informational market data, never investment advice.

## What it publishes

| Surface | Cadence | What it is |
|---|---|---|
| **Market briefs** | 1/day | An original 700–1,000-word brief written from our own collected numbers — a story of the session, not a list |
| **News analyses** | up to 4/day | Attributed analysis that adds our own market data for the coins involved; we never rewrite the source's prose, and quiet days publish nothing |
| **Signals** | 1/day per coin | One direction per tracked coin: **Rising / Falling / Steady / Choppy** — no "buy", no "sell", no confidence scores |
| **Prices** | ~30 min | Market data with a real as-of timestamp on every surface |
| **Social** | 4/day | Recaps on Bluesky, linking back to the site |

## The API

A free, public data API — keys are **instant and self-serve**, no approval queue:

```bash
curl -H "X-API-Key: mcs_your_key" \
  https://api.mycryptosignal.workers.dev/api/signals
```

- **Free tier:** 60 req/min · 1,000 req/day · 15,000 req/month
- **Endpoints:** signals, signal history, market, on-chain, prices, news, health
- **Paid tiers:** Startup $19/mo, Growth $79/mo, Enterprise by contract
- **Docs:** https://mycryptosignal.com/docs/ · **Get a key:** https://mycryptosignal.com/get-access/

## This repository

This is the **public, brand-facing repo for MyCryptoSignal.** It presents what the site is and
publishes the **frontend** — the static site you see at mycryptosignal.com — so anyone can read,
build, and learn from it.

It is **not** a build guide for the full platform. The data engine, the API gateway, and the
operating systems that run the publication are private — they are the product, and they are not
published here.

### Frontend

The site is an [Astro](https://astro.build) static build. It reads the public API **at build time**
and ships fully static pages — no client-side API calls, no secrets in the browser.

```bash
cd frontend
npm install
cp .env.example .env   # PUBLIC_API_BASE defaults to the live API
npm run dev            # local dev
npm run build          # static build → dist/
```

The frontend is MIT-licensed and safe to reuse. The data behind it (the API) is a separate,
operated service.

## Rules the publication lives by

- **Never "live" or "real-time."** Prices are collected on a 30-minute schedule; every data
  surface shows a real as-of timestamp.
- **Never advice.** No "buy", "sell", "should", "predict", no confidence percentages. Direction
  words only.
- **Never invented numbers.** Every figure in a brief or analysis is verified against the data it
  was written from — our collected market numbers, or the source's own words.
- **Never rewrite the news.** Analyses summarize, credit the source, link out, and add our own
  market numbers.
- **Nothing publishes below the bar.** Every article must pass coded checks before publication —
  length floors, attribution, advice and hype scans, malformed-text checks. A draft that fails is
  retried with the failure fed back, then dropped. There is no fallback that publishes a stub.
- **The system watches itself.** Health checks run every 15 minutes and email when something
  breaks; a daily operations email reports the whole state; an external watchdog on a separate
  machine notices if the publication goes silent. No one has to remember to look.

The full, plain-English version is at
**[How this publication is operated by AI →](https://mycryptosignal.com/how-it-is-operated/)**

## Ownership

MyCryptoSignal is a brand of **Axiopistis Holdings LC**, a privately held company in Atlanta,
Georgia.

- **Site:** https://mycryptosignal.com
- **How it is operated (the full design):** https://mycryptosignal.com/how-it-is-operated/
- **Support:** support@mycryptosignal.com
- **Editorial policy:** https://mycryptosignal.com/editorial-policy/
- **How we make money:** https://mycryptosignal.com/disclosure/

---

<p align="center"><sub>Signals, not noise.<br>
© Axiopistis Holdings LC. All rights reserved.</sub></p>
