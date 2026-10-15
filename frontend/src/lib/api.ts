// Shared API types + a build-time (Node) API client.
//
// Every getter runs at BUILD TIME only. The site is fully static: the browser
// never calls the API, so the API base URL and read token are never shipped to
// visitors. All requests are GETs; authenticated endpoints need `X-API-Key`,
// supplied by the build-time PUBLIC_API_KEY (a public read-only token, not a
// secret). When the key is absent or a call fails, every getter returns `[]` /
// `null` and pages render their graceful empty state.

/** Plain direction words. Never "buy"/"sell" — see docs/rebrand/PLAN.md §4b. */
export type SignalDirection = 'Rising' | 'Falling' | 'Steady' | 'Choppy';

export const SIGNAL_DIRECTIONS: SignalDirection[] = ['Rising', 'Falling', 'Steady', 'Choppy'];

export interface Signal {
  coin_id: string;
  symbol: string;
  action: SignalDirection;
  explanation: string;
  signal_date: string;
  timestamp: number;
}

export interface SignalHistoryPoint {
  id: number;
  timestamp: number;
  signal_date: string;
  action: SignalDirection;
  explanation: string;
}

export interface Coin {
  coin_id: string;
  symbol: string;
  name: string;
  category?: string;
  rank?: number | null;
  is_tracked?: number;
}

export interface MarketRow {
  coin_id: string;
  symbol: string;
  name: string;
  timestamp: number;
  price: number | null;
  market_cap: number | null;
  volume_24h: number | null;
  price_change_24h: number | null;
  price_change_7d: number | null;
  price_change_30d: number | null;
}

export interface PriceRow {
  coin_id: string;
  symbol: string;
  name: string;
  price: number | null;
  price_change_24h: number | null;
  price_change_7d: number | null;
  price_change_30d: number | null;
  market_cap: number | null;
  volume_24h: number | null;
  category: string;
  updated_at: number;
}

/** One OHLCV candle, keyed on `coin_id` (not symbol) — see packages/core candles repo. */
export interface Candle {
  coin_id: string;
  interval: string;
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  source: string;
}

export interface ArticleSummary {
  slug: string;
  headline: string;
  excerpt: string | null;
  category: string | null;
  source_name: string;
  source_url: string;
  published_at: number;
  word_count: number;
}

export interface Article extends ArticleSummary {
  id?: number;
  body: string;
  hero_image_url?: string | null;
  model?: string | null;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

const DEFAULT_BASE = 'https://api.mycryptosignal.workers.dev';

function resolveBase(): string {
  const env = (import.meta.env?.PUBLIC_API_BASE as string | undefined) ?? '';
  const base = env || DEFAULT_BASE;
  return base.replace(/\/+$/, '');
}

function resolveKey(): string {
  return (import.meta.env?.PUBLIC_API_KEY as string | undefined) ?? '';
}

/** Per-build memo cache: several pages read the same list. */
const cache = new Map<string, unknown>();

interface ApiOptions {
  /** Abort after this many ms (default 8000). Build-time calls stay bounded. */
  timeoutMs?: number;
}

/** GET a path; returns parsed JSON or null on any failure (never throws). */
export async function apiGet<T>(path: string, params?: Record<string, string>, opts: ApiOptions = {}): Promise<T | null> {
  const base = resolveBase();
  let url: string;
  try {
    const u = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`);
    if (params) for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    url = u.toString();
  } catch {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000);
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    const key = resolveKey();
    if (key) headers['x-api-key'] = key;
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function cached<T>(key: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  if (cache.has(key)) return cache.get(key) as T;
  let value: T = fallback;
  try {
    value = await loader();
  } catch {
    value = fallback;
  }
  cache.set(key, value);
  return value;
}

// ---------------------------------------------------------------------------
// Build-time loaders
// ---------------------------------------------------------------------------

export function getSignals(params?: Record<string, string>): Promise<Signal[]> {
  const key = `signals:${JSON.stringify(params ?? {})}`;
  return cached(key, async () => {
    const r = await apiGet<{ signals: Signal[] }>('/api/signals', params);
    return r?.signals ?? [];
  }, [] as Signal[]);
}

export function getSignalHistory(coinId: string, days = 30): Promise<SignalHistoryPoint[]> {
  return cached(`signals-history:${coinId}:${days}`, async () => {
    const r = await apiGet<{ history: SignalHistoryPoint[] }>('/api/signals/history', {
      coin_id: coinId,
      days: String(days),
    });
    return r?.history ?? [];
  }, [] as SignalHistoryPoint[]);
}

export function getCoins(): Promise<Coin[]> {
  return cached('coins', async () => {
    const r = await apiGet<{ coins: Coin[] }>('/api/coins');
    return r?.coins ?? [];
  }, [] as Coin[]);
}

export function getMarket(symbol?: string): Promise<MarketRow[]> {
  return cached(`market:${symbol ?? ''}`, async () => {
    const r = await apiGet<{ data: MarketRow[] }>('/api/market', symbol ? { symbol } : undefined);
    return r?.data ?? [];
  }, [] as MarketRow[]);
}

export function getPrices(limit = 200, category?: string): Promise<PriceRow[]> {
  const params: Record<string, string> = { limit: String(limit) };
  if (category) params.category = category;
  return cached(`prices:${limit}:${category ?? ''}`, async () => {
    const r = await apiGet<{ data: PriceRow[] }>('/api/prices', params);
    return r?.data ?? [];
  }, [] as PriceRow[]);
}

/**
 * Recent candles for one coin, NEWEST-FIRST (the API's own order — do not
 * assume chronological). Used only to draw decorative sparklines; a failed or
 * empty call renders an empty cell, never a fabricated line.
 */
export function getCandles(coinId: string, interval = '1h', limit = 24): Promise<Candle[]> {
  return cached(`candles:${coinId}:${interval}:${limit}`, async () => {
    const r = await apiGet<{ candles: Candle[] }>('/api/candles', {
      coin_id: coinId,
      interval,
      limit: String(limit),
    });
    return r?.candles ?? [];
  }, [] as Candle[]);
}

export function getNews(category?: string, limit = 100): Promise<ArticleSummary[]> {
  const params: Record<string, string> = { limit: String(limit) };
  if (category) params.category = category;
  return cached(`news:${category ?? ''}:${limit}`, async () => {
    const r = await apiGet<{ articles: ArticleSummary[] }>('/api/news', params);
    return r?.articles ?? [];
  }, [] as ArticleSummary[]);
}

export function getNewsArticle(slug: string): Promise<Article | null> {
  return cached(`news-article:${slug}`, async () => {
    const r = await apiGet<{ article: Article }>(`/api/news/${slug}`);
    return r?.article ?? null;
  }, null);
}

/**
 * The daily DATA BRIEF article (slug `market-<YYYY-MM-DD>`) — original prose
 * written from our own numbers. Separate surface from the digests.
 */
export async function getDataBriefs(limit = 30): Promise<ArticleSummary[]> {
  const all = await getNews(undefined, 100);
  return all.filter((a) => /^market-\d{4}-\d{2}-\d{2}$/.test(a.slug)).slice(0, limit);
}

/** Full article for every published item, body included (bounded, deduped). */
export async function getFullArticles(limit = 50): Promise<Article[]> {
  const list = await getNews(undefined, limit);
  return cached(`full-articles:${limit}`, async () => {
    const detailed = await Promise.all(
      list.map(async (a) => {
        const full = await getNewsArticle(a.slug);
        return full ?? { ...a, body: a.excerpt ?? '' };
      }),
    );
    return detailed;
  }, [] as Article[]);
}

/** The UTC date (YYYY-MM-DD) of the newest signal day, or today. */
export async function getLatestSignalDate(): Promise<string | null> {
  const signals = await getSignals();
  return signals[0]?.signal_date ?? null;
}
