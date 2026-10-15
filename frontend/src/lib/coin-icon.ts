// One coin icon, as markup — the single source used everywhere a coin is named
// (table rows, top movers, the coin page, the command palette, the watchlist).
//
// PURE / ISOMORPHIC: safe on the server *and* in a browser <script> (it imports
// only the site constants). Which file exists is decided at BUILD time (see
// lib/coin-assets.ts) and passed in as `file`; this function never guesses and
// there is no client-side onerror.
import { ASSET_V } from './site';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

/**
 * `<img>` when the coin has an icon, otherwise a deliberate-looking monogram tile
 * (the coin's first letter). `alt=""` on the image because the ticker symbol sits
 * right beside it (a non-empty alt would announce the coin twice); the monogram is
 * `aria-hidden` for the same reason. Explicit width/height ⇒ no layout shift.
 *
 * @param file  resolved asset filename (e.g. `bitcoin.png`) or null for no icon
 * @param symbol ticker, used for the monogram letter
 */
export function coinIconHtml(file: string | null | undefined, symbol: string): string {
  if (file) {
    return `<img class="coin-badge" src="/coins/${file}?v=${ASSET_V}" width="24" height="24" loading="lazy" decoding="async" alt="">`;
  }
  const letter = String(symbol ?? '').trim().charAt(0).toUpperCase() || '•';
  return `<span class="coin-badge coin-badge-mono" aria-hidden="true">${escapeHtml(letter)}</span>`;
}
