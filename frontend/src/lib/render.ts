// Pure render helpers shared by server (build) and browser (client filter).
// Returns HTML strings; every interpolated value is escaped.

import type { ArticleSummary, PriceRow, Signal, SignalDirection } from './api';
import { formatCompact, formatDate, formatPct, formatUsd } from './site';
import { coinIconHtml } from './coin-icon';

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Direction pill. Plain words only — never buy/sell (PLAN §4b). */
export function directionBadge(action: SignalDirection | string): string {
  const a = String(action);
  const cls =
    a === 'Rising'
      ? 'signal-rising'
      : a === 'Falling'
        ? 'signal-falling'
        : a === 'Choppy'
          ? 'signal-choppy'
          : 'signal-steady';
  return `<span class="signal-pill ${cls}">${escapeHtml(a)}</span>`;
}

/** @deprecated kept as an alias for older templates. */
export const actionBadge = directionBadge;

export function changeClass(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'flat';
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'flat';
}

/**
 * A single row for the /signals table. `iconFile` (the resolved asset filename,
 * or null) is decided at build time (lib/coin-assets.ts); the icon markup is
 * produced by the one shared helper so the server render and the client re-render
 * are byte-identical.
 */
export function signalRow(s: Signal & { iconFile?: string | null }): string {
  return `<tr>
    <td><span class="coin-id">${coinIconHtml(s.iconFile, s.symbol)}<a class="mono" href="${hrefForSymbol(s.symbol)}">${escapeHtml(s.symbol)}</a></span></td>
    <td data-label="Direction">${directionBadge(s.action)}</td>
    <td class="muted mono" data-label="Date">${escapeHtml(s.signal_date)}</td>
    <td class="explain" data-label="Reason">${escapeHtml(s.explanation)}</td>
    <td class="watch-cell" data-label="Watch">${watchStarHtml(s.symbol)}</td>
  </tr>`;
}

export function signalRows(signals: (Signal & { iconFile?: string | null })[]): string {
  return signals.map(signalRow).join('');
}

/**
 * A single row for the /prices table. `spark` is a pre-rendered inline SVG (our
 * own markup); `iconFile` is the build-time icon resolution — both never user input.
 */
export function priceRow(p: PriceRow & { spark?: string | null; iconFile?: string | null }): string {
  const cat = p.category ? `<span class="tag">${escapeHtml(p.category)}</span>` : '';
  // `spark` is a pre-rendered inline SVG (or '' when there are no candles) — see
  // lib/sparkline.ts. It is our own markup, never user input.
  return `<tr>
    <td><span class="coin-id">${coinIconHtml(p.iconFile, p.symbol)}<a class="mono" href="${hrefForSymbol(p.symbol)}">${escapeHtml(p.symbol)}</a></span></td>
    <td class="name-cell" data-label="Name">${escapeHtml(p.name)} ${cat}</td>
    <td class="mono" data-label="Price">${formatUsd(p.price)}</td>
    <td class="mono ${changeClass(p.price_change_24h)}" data-label="24H">${formatPct(p.price_change_24h)}</td>
    <td class="mono ${changeClass(p.price_change_7d)}" data-label="7D">${formatPct(p.price_change_7d)}</td>
    <td class="mono ${changeClass(p.price_change_30d)}" data-label="30D">${formatPct(p.price_change_30d)}</td>
    <td class="mono muted" data-label="Market cap">${formatCompact(p.market_cap)}</td>
    <td class="spark" data-label="Trend"><span class="spark-slot">${p.spark ?? ''}</span></td>
    <td class="watch-cell" data-label="Watch">${watchStarHtml(p.symbol, p.name)}</td>
  </tr>`;
}

export function priceRows(prices: (PriceRow & { spark?: string | null })[]): string {
  return prices.map(priceRow).join('');
}

/** Article card for /news, /market and the landing page. */
export function articleCard(a: ArticleSummary): string {
  const cat = a.category ? `<span class="tag">${escapeHtml(a.category)}</span>` : '';
  const excerpt = a.excerpt ? `<p class="card-excerpt">${escapeHtml(a.excerpt)}</p>` : '';
  const href = hrefForArticle(a.slug);
  return `<article class="card" data-category="${escapeHtml(a.category ?? '')}">
    <div class="card-meta">${cat}<span class="mono muted">${escapeHtml(a.source_name)}</span><span class="mono muted">${formatDate(a.published_at)}</span></div>
    <h3 class="card-title"><a href="${href}">${escapeHtml(a.headline)}</a></h3>
    ${excerpt}
  </article>`;
}

export function articleCards(articles: ArticleSummary[]): string {
  return articles.map(articleCard).join('');
}

/** Site-relative href for an article. Trailing slash = the served URL (see .htaccess). */
export function hrefForArticle(slug: string): string {
  const m = /^market-(\d{4}-\d{2}-\d{2})$/.exec(slug);
  return m ? `/market/${m[1]}/` : `/news/${slug}/`;
}

/** Site-relative href for a coin's signal page. */
export function hrefForSymbol(symbol: string): string {
  return `/signals/${symbol.toLowerCase()}/`;
}

export function emptyState(message: string): string {
  return `<div class="empty-state"><p class="mono">${escapeHtml(message)}</p></div>`;
}

/**
 * Watchlist star control as markup. Shared by the /prices and /signals tables
 * (server and client render). The browser runtime wires the real state.
 */
export function watchStarHtml(symbol: string, name?: string): string {
  const sym = String(symbol).toUpperCase();
  const label = name ?? sym;
  return `<button class="watch-star" type="button" data-watch="${escapeHtml(sym)}" aria-pressed="false" aria-label="Add ${escapeHtml(label)} to watchlist" title="Add ${escapeHtml(label)} to watchlist"><span class="watch-glyph" aria-hidden="true">☆</span></button>`;
}
