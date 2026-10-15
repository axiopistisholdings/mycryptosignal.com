// ---------------------------------------------------------------------------
// SINGLE SOURCE OF TRUTH for every commercial / affiliate link on this site.
//
// FIREWALL RULE (reviewed by counsel — do not relitigate):
//   * The ONLY page permitted to render a commercial link is
//     `/tools-and-partners/`.
//   * The ONLY component permitted to render one is `PartnerLink.astro`,
//     which reads its entries from this file.
//   * No commercial link may share a block, card, table or section with a
//     signal, direction word, brief or news digest — ever.
//   * `scripts/check-commercial-firewall.ts` fails the build if any host
//     named here appears anywhere in the built HTML outside
//     `/tools-and-partners/`.
//
// Because disclosure text and the `rel="sponsored nofollow noopener"`
// attributes are emitted by `PartnerLink.astro` (not hand-written per link),
// they cannot drift. Add links HERE, never inline in a page.
// ---------------------------------------------------------------------------

/**
 * Risk ordering, lowest first. A trading/exchange venue (`exchange`) is
 * deliberately LAST and is always rendered in its own clearly-separated
 * section. See the page for the separation note.
 */
export type PartnerCategory = 'data' | 'tax' | 'wallet' | 'portfolio' | 'exchange';

export interface Partner {
  /** Displayed name — what a visitor sees and clicks. */
  name: string;
  /** Destination URL, always opened in a new tab. */
  url: string;
  /** Risk bucket; controls ordering and section grouping. */
  category: PartnerCategory;
  /** One honest line about what the product actually is. No superlatives. */
  description: string;
  /** True when we are paid for a signup. Drives the FTC disclosure + `rel`. */
  compensated: boolean;
  /**
   * Optional per-link disclosure override. When omitted (the normal case)
   * `PartnerLink.astro` uses `DISCLOSURE_TEXT`. A `compensated: true` entry
   * whose resolved disclosure text is blank is a HARD ERROR and will not
   * render — that is the enforcement point the tests exercise.
   */
  disclosure?: string;
}

/** Lowest-risk category first; the exchange venue is always last. */
export const CATEGORY_ORDER: readonly PartnerCategory[] = [
  'data',
  'tax',
  'wallet',
  'portfolio',
  'exchange',
];

export const CATEGORY_LABEL: Record<PartnerCategory, string> = {
  data: 'Data & analytics tools',
  tax: 'Crypto tax software',
  wallet: 'Hardware wallets',
  portfolio: 'Portfolio trackers',
  exchange: 'Trading venues',
};

/**
 * FTC per-link disclosure. Rendered IMMEDIATELY ADJACENT to every compensated
 * link (never only in the footer). Wording is fixed here so it cannot drift.
 */
export const DISCLOSURE_TEXT =
  'Affiliate link — we earn a commission if you sign up (no extra cost to you).';

/**
 * The live partner list.
 *
 * INTENTIONALLY EMPTY. We hold no working affiliate links yet, so we publish
 * nothing rather than a dead or unreviewed link. The page renders an honest
 * empty state when this list is empty.
 *
 * SHAPE OF A REAL ENTRY (do NOT uncomment until the link is live and reviewed
 * against the firewall rules above — each line is a real, typed `Partner`):
 *
 *   {
 *     name: 'Example Analytics',
 *     url: 'https://example-analytics.test/signup',
 *     category: 'data',
 *     description: 'On-chain analytics for public chains. Free tier available.',
 *     compensated: true,
 *   },
 *
 * A non-compensated listing (we get nothing for it) uses `compensated: false`
 * and renders with `rel="noopener"` and no affiliate disclosure.
 */
export const PARTNERS: Partner[] = [];

/**
 * Hosts named anywhere in this data file — compensated or not. The firewall
 * guard treats every one of these as commercial: if it appears in the built
 * HTML outside `/tools-and-partners/`, the guard fails.
 */
export function commercialHosts(partners: Partner[] = PARTNERS): string[] {
  const hosts = new Set<string>();
  for (const p of partners) {
    try {
      hosts.add(new URL(p.url).hostname.toLowerCase());
    } catch {
      // A malformed URL is a data bug; surface it by leaving it out of the
      // host set (it can never match DOM text anyway).
    }
  }
  return [...hosts].sort();
}
