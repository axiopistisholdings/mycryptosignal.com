// Build-time helpers for the interactive coin chart.
//
// The chart is rendered in the browser from a per-coin candle series embedded as
// a JSON island — one coin per page, never the whole market. We only ever read
// the real `close` values the engine stored; a coin with no candles yields an
// empty series and the page shows an honest empty state (no fabricated line).

import type { Candle } from './api';

/** 30 days of hourly closes ≈ 720 points ≈ 15 KB of JSON. */
export const CHART_LIMIT = 720;

/** Range → number of trailing points rendered. 24H < 7D < 30D by construction. */
export const CHART_RANGES = {
  '24h': 24,
  '7d': 168,
  '30d': CHART_LIMIT,
} as const;

export type ChartRange = keyof typeof CHART_RANGES;

/** Compact, chronological series. Parallel arrays keep the JSON island small. */
export interface ChartSeries {
  /** Unix seconds (ascending). */
  t: number[];
  /** Closing price aligned with `t`. */
  c: number[];
}

export const EMPTY_SERIES: ChartSeries = { t: [], c: [] };

/**
 * Turn the engine's newest-first candle page into a chronological series capped
 * at CHART_LIMIT points. Invalid rows are dropped, never padded.
 */
export function buildChartSeries(candles: Candle[]): ChartSeries {
  const rows = candles
    .filter((c) => Number.isFinite(c.ts) && Number.isFinite(c.close))
    .slice(0, CHART_LIMIT)
    .reverse(); // API is newest-first → oldest-first for a left-to-right chart
  const t: number[] = [];
  const c: number[] = [];
  for (const row of rows) {
    t.push(row.ts);
    c.push(row.close);
  }
  return { t, c };
}

/** Trailing slice for a range, clamped to the points actually available. */
export function sliceSeries(series: ChartSeries, range: ChartRange): ChartSeries {
  const n = Math.min(CHART_RANGES[range], series.t.length);
  const from = Math.max(0, series.t.length - n);
  return { t: series.t.slice(from), c: series.c.slice(from) };
}
