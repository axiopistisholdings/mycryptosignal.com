// Build-time market-math helpers for the engagement modules.
//
// Every value here is derived from the engine's real snapshot data (getPrices /
// getSignals). Missing inputs return `null` so callers render nothing rather
// than a zero — an invented number is worse than an absent one.

import { getCandles, type Candle, type PriceRow, type Signal } from './api';

export interface MarketSnapshot {
  totalMcap: number;
  /** Cap-weighted 24h change across every row that carries both fields. */
  weightedChange24h: number | null;
  btc: PriceRow | null;
  eth: PriceRow | null;
  /** btc.market_cap / total * 100. */
  btcDominance: number | null;
  /** Newest `updated_at` (unix seconds) across the snapshot. */
  updatedAt: number | null;
}

export function computeSnapshot(prices: PriceRow[]): MarketSnapshot | null {
  if (!prices.length) return null;

  let total = 0;
  let weightSum = 0;
  let weightCap = 0;
  let updatedAt = 0;

  for (const p of prices) {
    const cap = typeof p.market_cap === 'number' && Number.isFinite(p.market_cap) ? p.market_cap : null;
    if (cap && cap > 0) total += cap;
    if (
      cap &&
      cap > 0 &&
      typeof p.price_change_24h === 'number' &&
      Number.isFinite(p.price_change_24h)
    ) {
      weightSum += cap * p.price_change_24h;
      weightCap += cap;
    }
    if (typeof p.updated_at === 'number' && p.updated_at > updatedAt) updatedAt = p.updated_at;
  }

  if (total <= 0) return null;

  const bySymbol = new Map(prices.map((p) => [p.symbol.toUpperCase(), p]));
  const btc = bySymbol.get('BTC') ?? null;
  const eth = bySymbol.get('ETH') ?? null;
  const btcDominance = btc?.market_cap ? (btc.market_cap / total) * 100 : null;

  return {
    totalMcap: total,
    weightedChange24h: weightCap > 0 ? weightSum / weightCap : null,
    btc,
    eth,
    btcDominance,
    updatedAt: updatedAt > 0 ? updatedAt : null,
  };
}

export interface Breadth {
  rising: number;
  /** Steady + Choppy — both share the neutral segment (they are "not moving a direction"). */
  steady: number;
  falling: number;
  total: number;
}

export function computeBreadth(signals: Signal[]): Breadth {
  let rising = 0;
  let falling = 0;
  let steady = 0;
  for (const s of signals) {
    if (s.action === 'Rising') rising++;
    else if (s.action === 'Falling') falling++;
    else steady++;
  }
  return { rising, steady, falling, total: signals.length };
}

export function topMovers(prices: PriceRow[], n = 3): { gains: PriceRow[]; falls: PriceRow[] } {
  const withPct = prices.filter(
    (p) => typeof p.price_change_24h === 'number' && Number.isFinite(p.price_change_24h),
  );
  const sorted = [...withPct].sort(
    (a, b) => (b.price_change_24h as number) - (a.price_change_24h as number),
  );
  const gains = sorted.slice(0, n);
  const falls = sorted.slice(-n).reverse();
  return { gains, falls };
}

/**
 * Fetch the last `points` closes for each coin concurrently (newest-first API
 * order → chronological). Failures are tolerated: a symbol with no candles is
 * simply absent from the map and its sparkline cell renders empty.
 */
export async function loadSparkSeries(
  prices: PriceRow[],
  points = 24,
): Promise<Map<string, number[]>> {
  const map = new Map<string, number[]>();
  const results = await Promise.allSettled(
    prices
      .filter((p) => p.coin_id)
      .map(async (p) => {
        const candles: Candle[] = await getCandles(p.coin_id, '1h', points);
        const closes = candles
          .slice(0, points)
          .map((c) => c.close)
          .reverse()
          .filter((n) => Number.isFinite(n));
        return [p.symbol.toUpperCase(), closes] as const;
      }),
  );
  for (const r of results) {
    if (r.status === 'fulfilled') map.set(r.value[0], r.value[1]);
  }
  return map;
}
