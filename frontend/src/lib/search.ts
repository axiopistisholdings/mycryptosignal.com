// Build-time static search index for the ⌘K command palette.
//
// Every coin (symbol + name) and every page, emitted once per page as a JSON
// island. The palette filters this list in the browser — no network call, and no
// dependency on the API at runtime.

import type { Coin, PriceRow } from './api';
import { coinIconFile } from './coin-assets';

export interface SearchEntry {
  /** Primary label shown and matched strongly (symbol or page title). */
  t: string;
  /** Secondary label (coin name or page group). */
  s: string;
  /** Target path. */
  u: string;
  /** "coin" | "page" — drives the badge. */
  k: 'coin' | 'page';
  /** Resolved icon filename (e.g. `bitcoin.svg`) or null — coins only. */
  f?: string | null;
}

/** Every real page on the site (mirrors STATIC_PATHS in sitemap.xml.ts). */
export const SITE_PAGES: { path: string; title: string; group: string }[] = [
  { path: '/', title: 'Home', group: 'Page' },
  { path: '/signals/', title: 'Signals', group: 'Page' },
  { path: '/market/', title: 'Market briefs', group: 'Page' },
  { path: '/news/', title: 'News', group: 'Page' },
  { path: '/prices/', title: 'Prices', group: 'Page' },
  { path: '/api/', title: 'API', group: 'Page' },
  { path: '/docs/', title: 'API docs', group: 'Page' },
  { path: '/get-access/', title: 'Get access', group: 'Page' },
  { path: '/about/', title: 'About', group: 'Page' },
  { path: '/contact/', title: 'Contact', group: 'Page' },
  { path: '/editorial-policy/', title: 'Editorial policy', group: 'Legal' },
  { path: '/terms/', title: 'Terms of service', group: 'Legal' },
  { path: '/privacy/', title: 'Privacy policy', group: 'Legal' },
  { path: '/disclaimer/', title: 'Disclaimer', group: 'Legal' },
  { path: '/copyright/', title: 'Copyright', group: 'Legal' },
];

/** Build the palette index: pages first, then coins A→Z. */
export function buildSearchIndex(coins: Coin[], prices: PriceRow[]): SearchEntry[] {
  const bySymbol = new Map<string, SearchEntry>();
  const add = (symbol: string, name: string, coinId: string) => {
    const sym = symbol.toUpperCase();
    if (!sym || bySymbol.has(sym)) return;
    bySymbol.set(sym, {
      t: sym,
      s: name || sym,
      u: `/signals/${sym.toLowerCase()}/`,
      k: 'coin',
      // Build-time icon resolution (see lib/coin-assets.ts): the palette and the
      // watchlist render the img or the monogram from this — no onerror.
      f: coinIconFile(coinId),
    });
  };
  for (const c of coins) if (c?.symbol) add(c.symbol, c.name ?? '', c.coin_id ?? '');
  // Symbols published in the price table that are not in the tracked list.
  for (const p of prices) if (p?.symbol) add(p.symbol, p.name ?? '', p.coin_id ?? '');

  const coinEntries = [...bySymbol.values()].sort((a, b) => a.t.localeCompare(b.t));
  const pageEntries: SearchEntry[] = SITE_PAGES.map((p) => ({
    t: p.title,
    s: p.group,
    u: p.path,
    k: 'page',
  }));
  return [...pageEntries, ...coinEntries];
}
