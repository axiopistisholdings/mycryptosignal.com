// Single source of truth for brand + site-wide constants.

export const SITE = {
  name: 'MyCryptoSignal',
  tagline: 'Signals, not noise.',
  domain: 'mycryptosignal.com',
  url: 'https://mycryptosignal.com',
  /**
   * Public API host advertised in the docs (separate from this static site).
   * This is the Cloudflare Worker gateway that reverse-proxies to the real
   * engine on the VPS over a Cloudflare Tunnel (Workers VPC binding) — see
   * apps/api-gateway/. It serves our own data, not the legacy worker.
   */
  apiBase: 'https://api.mycryptosignal.workers.dev',
  description:
    'A crypto market-data site: original daily market briefs, attributed news digests, prices collected on a 30-minute schedule, and deterministic daily direction signals behind one documented API.',
  operator: 'Axiopistis Holdings LC',
  operatorNote: 'MyCryptoSignal is operated by Axiopistis Holdings LC.',
  supportEmail: 'support@mycryptosignal.com',
  twitter: 'https://x.com/mycrypto_signal',
  twitterHandle: '@mycrypto_signal',
  bluesky: 'https://bsky.app/profile/mycryptosignal.bsky.social',
  github: 'https://github.com/axiopistisholdings/mycryptosignal.com',
  /** Publisher identity used by structured data. */
  language: 'en',
  /**
   * Google Search Console / Publisher Center ownership verification.
   * This value is PUBLIC by design — it is emitted as a meta tag on every page.
   */
  googleSiteVerification: 'cHA3II5u38H1O-gbkhEwRwdLigwELswPCHUmQO_0740',
  /**
   * First-party, cookieless web analytics. `enabled` is the single kill-switch:
   * when false, nothing is emitted (no config script, no beacon <script>).
   * `endpoint` is the gateway collector URL — a build-time constant injected
   * into the page, never hardcoded in the public beacon script.
   * See apps/web/public/mcs-analytics.js and apps/api-gateway/.
   */
  analytics: {
    enabled: true,
    endpoint: 'https://api.mycryptosignal.workers.dev/t',
  },
  /**
   * Email list. Switched ON 2026-10-13 once sending was proven.
   *
   * Sending runs from notify@mycryptosignal.com over Hostinger SMTP, authenticated
   * with a revocable app password (not the mailbox password), configured as SMTP_*
   * on the engine. Verified end to end from inside the engine container:
   * smtp.hostinger.com:465, verify OK, message accepted.
   */
  subscribe: {
    enabled: true,
  },
} as const;

/**
 * Cache-busting version for static brand assets (favicon, app icons, share cards).
 *
 * WHY THIS EXISTS: those files are served with a long cache (and social platforms
 * cache share cards for weeks), so replacing the file at the same URL is invisible
 * to everyone who has already visited. Bumping this number changes the URL and
 * forces browsers, the CDN and scrapers to re-fetch. **Bump it whenever any file
 * in `public/icons/` or `public/favicon.ico` changes.**
 */
export const ASSET_V = '6';

export const NAV = [
  { href: '/signals/', label: 'Signals' },
  { href: '/market/', label: 'Market briefs' },
  { href: '/news/', label: 'News' },
  { href: '/prices/', label: 'Prices' },
  { href: '/api/', label: 'API' },
  { href: '/docs/', label: 'Docs' },
  { href: '/get-access/', label: 'Get Access' },
] as const;

export interface FooterLink {
  href: string;
  label: string;
  external?: boolean;
}
export interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

export const FOOTER_LINKS: FooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { href: '/signals/', label: 'Signals' },
      { href: '/market/', label: 'Market briefs' },
      { href: '/news/', label: 'News' },
      { href: '/prices/', label: 'Prices' },
      { href: '/api/', label: 'API' },
      { href: '/docs/', label: 'API Docs' },
      { href: '/get-access/', label: 'Get API Key' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '/about/', label: 'About' },
      { href: '/contact/', label: 'Contact' },
      { href: '/editorial-policy/', label: 'Editorial Policy' },
      { href: '/tools-and-partners/', label: 'Tools & Partners' },
      { href: '/feed.xml', label: 'RSS Feed' },
      { href: SITE.github, label: 'GitHub', external: true },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/terms/', label: 'Terms of Service' },
      { href: '/privacy/', label: 'Privacy Policy' },
      { href: '/disclaimer/', label: 'Disclaimer' },
      { href: '/disclosure/', label: 'How we make money' },
      { href: '/copyright/', label: 'Copyright' },
    ],
  },
];

export const NFA_SHORT =
  'Informational data only — not financial advice. Crypto trading carries significant risk. Do your own research.';

export const NFA_LONG =
  'MyCryptoSignal provides informational data only. Signals and market briefs are NOT financial advice. ' +
  'Trading cryptocurrencies carries significant risk. Always do your own research and consult ' +
  'with qualified financial advisors before making investment decisions. Past performance does ' +
  'not guarantee future results.';

export const API_ATTRIBUTION = 'Powered by MyCryptoSignal';

/** Paths that are real files served at the root (no directory trailing slash). */
const FILE_PATHS = new Set(['/feed.xml', '/sitemap.xml', '/news-sitemap.xml', '/robots.txt', '/manifest.json']);

/**
 * The ONE canonical URL form for a site path. Directory routes are served by
 * Apache with a trailing slash (see `.htaccess`), so the canonical, sitemap, and
 * feed links must all use that exact form to avoid a redirect mismatch.
 */
export function canonicalUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const qIndex = clean.indexOf('?');
  const withoutQuery = qIndex >= 0 ? clean.slice(0, qIndex) : clean;
  const query = qIndex >= 0 ? clean.slice(qIndex) : '';
  // Normalise first: strip every trailing slash so callers that already passed a
  // trailing slash (e.g. hrefForArticle) can never produce a `//` double slash.
  const route = withoutQuery.replace(/\/+$/, '');
  if (route === '') return `${SITE.url}/${query}`; // bare "/" stays "/"
  if (FILE_PATHS.has(route) || /\.[a-z0-9]+$/i.test(route)) {
    return `${SITE.url}${route}${query}`; // real files: no trailing slash
  }
  return `${SITE.url}${route}/${query}`; // directory routes: exactly one
}

/** Backwards-compatible alias used across pages/templates. */
export function absoluteUrl(path: string): string {
  return canonicalUrl(path);
}

/** Absolute URL for a data-brief article: /market/<YYYY-MM-DD>. */
export function briefPath(day: string): string {
  return `/market/${day}`;
}

/** Extract the YYYY-MM-DD from a `market-<date>` slug, or null. */
export function briefDate(slug: string): string | null {
  const m = /^market-(\d{4}-\d{2}-\d{2})$/.exec(slug);
  return m ? m[1] : null;
}

export function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1) {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (abs >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toPrecision(4)}`;
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `$${Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value)}`;
}

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDate(unixSeconds: number | null | undefined): string {
  if (!unixSeconds) return '—';
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

export function formatDateTime(unixSeconds: number | null | undefined): string {
  if (!unixSeconds) return '—';
  return new Date(unixSeconds * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

/** ISO 8601 with UTC offset, for structured data (`datePublished`). */
export function isoUnix(unixSeconds: number | null | undefined): string {
  const s = unixSeconds && Number.isFinite(unixSeconds) ? unixSeconds : 0;
  return new Date(s * 1000).toISOString();
}

/** Human date for visible article headers, e.g. "12 October 2026, 14:30 UTC". */
export function formatDateTimeLong(unixSeconds: number | null | undefined): string {
  if (!unixSeconds) return '—';
  const d = new Date(unixSeconds * 1000);
  const date = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const time = d.toISOString().slice(11, 16);
  return `${date}, ${time} UTC`;
}
