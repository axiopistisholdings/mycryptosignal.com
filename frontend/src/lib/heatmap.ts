// Build-time squarified treemap for the /prices market heatmap.
//
// area = market cap, colour = a discrete 5-step scale on 24h change. The layout
// is computed at build time and emitted as plain positioned markup, so it costs
// no JavaScript in the browser.
//
// The market is heavily skewed (the largest coin can be ~60% of tracked cap), so
// a linear treemap would leave a long tail of unreadable slivers. We therefore
// drop tiles below a legibility threshold and re-lay out the survivors, so the
// kept tiles still tile the box exactly — no overlaps, no gaps, and nothing
// rendered too small to read.

import type { PriceRow } from './api';

export interface TreemapRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HeatTile {
  symbol: string;
  name: string;
  href: string;
  /** 24h change (may be null → neutral step). */
  change: number | null;
  marketCap: number;
  rect: TreemapRect;
  /** 0 = strong fall … 4 = strong rise (discrete, greyscale-safe). */
  step: 0 | 1 | 2 | 3 | 4;
}

export interface HeatmapResult {
  tiles: HeatTile[];
  /** Coins dropped because their tile would be unreadable. */
  omitted: number;
}

/** Discrete 5-step scale on 24h change. Never a gradient. */
export function changeStep(change: number | null | undefined): 0 | 1 | 2 | 3 | 4 {
  if (change === null || change === undefined || !Number.isFinite(change)) return 2;
  if (change <= -5) return 0;
  if (change < -1) return 1;
  if (change <= 1) return 2;
  if (change < 5) return 3;
  return 4;
}

interface Node {
  symbol: string;
  name: string;
  href: string;
  change: number | null;
  marketCap: number;
  value: number;
}

interface RowItem {
  node: Node;
  area: number;
}

function worstRatio(row: RowItem[], side: number): number {
  const s = row.reduce((a, r) => a + r.area, 0);
  if (s <= 0 || side <= 0) return Infinity;
  let max = -Infinity;
  let min = Infinity;
  for (const r of row) {
    if (r.area > max) max = r.area;
    if (r.area < min) min = r.area;
  }
  if (min <= 0) return Infinity;
  return Math.max((side * side * max) / (s * s), (s * s) / (side * side * min));
}

/** Place one squarified row along the shorter side; returns the remaining box. */
function placeRow(row: RowItem[], rect: TreemapRect, out: HeatTile[]): TreemapRect {
  const s = row.reduce((a, r) => a + r.area, 0) || 1;
  if (rect.w >= rect.h) {
    const stripW = s / rect.h;
    let y = rect.y;
    for (const r of row) {
      const h = rect.h * (r.area / s);
      out.push({
        symbol: r.node.symbol,
        name: r.node.name,
        href: r.node.href,
        change: r.node.change,
        marketCap: r.node.marketCap,
        rect: { x: rect.x, y, w: stripW, h },
        step: changeStep(r.node.change),
      });
      y += h;
    }
    return { x: rect.x + stripW, y: rect.y, w: rect.w - stripW, h: rect.h };
  }
  const stripH = s / rect.w;
  let x = rect.x;
  for (const r of row) {
    const w = rect.w * (r.area / s);
    out.push({
      symbol: r.node.symbol,
      name: r.node.name,
      href: r.node.href,
      change: r.node.change,
      marketCap: r.node.marketCap,
      rect: { x, y: rect.y, w, h: stripH },
      step: changeStep(r.node.change),
    });
    x += w;
  }
  return { x: rect.x, y: rect.y + stripH, w: rect.w, h: rect.h - stripH };
}

/** Squarified treemap (Bruls et al.) — deterministic, no dependencies. */
function squarify(nodes: Node[], rect: TreemapRect): HeatTile[] {
  const out: HeatTile[] = [];
  const total = nodes.reduce((a, n) => a + n.value, 0);
  if (total <= 0) return out;
  const scale = (rect.w * rect.h) / total;
  const arr: RowItem[] = nodes.map((n) => ({ node: n, area: n.value * scale }));

  let remaining: TreemapRect = { ...rect };
  let row: RowItem[] = [];
  let i = 0;
  while (i < arr.length) {
    const side = Math.min(remaining.w, remaining.h);
    const candidate = [...row, arr[i]!];
    if (row.length === 0 || worstRatio(candidate, side) <= worstRatio(row, side)) {
      row.push(arr[i]!);
      i++;
    } else {
      remaining = placeRow(row, remaining, out);
      row = [];
    }
  }
  if (row.length) placeRow(row, remaining, out);
  return out;
}

export interface HeatmapOptions {
  /** Reference box in px; tiles are laid out here then emitted as % of the box. */
  width?: number;
  height?: number;
  /** Reject tiles narrower or shorter than this many reference px. */
  minSide?: number;
}

/**
 * Build the heatmap. Coins are taken largest-cap first; the smallest are dropped
 * one at a time until every surviving tile clears the legibility threshold, then
 * the survivors are laid out to fill the box exactly.
 */
export function buildHeatmap(prices: PriceRow[], opts: HeatmapOptions = {}): HeatmapResult {
  const width = opts.width ?? 1120;
  const height = opts.height ?? 480;
  const minSide = opts.minSide ?? 46;

  const eligible: Node[] = prices
    .filter((p) => p.symbol && typeof p.market_cap === 'number' && Number.isFinite(p.market_cap) && p.market_cap > 0)
    .map((p) => ({
      symbol: p.symbol.toUpperCase(),
      name: p.name || p.symbol.toUpperCase(),
      href: `/signals/${p.symbol.toLowerCase()}/`,
      change: typeof p.price_change_24h === 'number' && Number.isFinite(p.price_change_24h) ? p.price_change_24h : null,
      marketCap: p.market_cap as number,
      value: p.market_cap as number,
    }))
    .sort((a, b) => b.value - a.value);

  if (!eligible.length) return { tiles: [], omitted: 0 };

  let kept = eligible;
  let tiles: HeatTile[] = [];
  while (kept.length > 0) {
    tiles = squarify(kept, { x: 0, y: 0, w: width, h: height });
    const smallestSide = tiles.reduce((m, t) => Math.min(m, Math.min(t.rect.w, t.rect.h)), Infinity);
    if (tiles.length <= 1 || smallestSide >= minSide) break;
    kept = kept.slice(0, kept.length - 1); // drop the smallest-cap coin and retry
  }

  return { tiles, omitted: eligible.length - tiles.length };
}
