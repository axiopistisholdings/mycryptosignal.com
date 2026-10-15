// Pure helpers behind the commercial/affiliate firewall.
//
// Kept free of Astro so they are trivially unit-testable. `PartnerLink.astro`
// and `news-sitemap.xml.ts` are thin callers of these functions — the rules
// live here once.

import { DISCLOSURE_TEXT, type Partner } from '../data/partners';

/**
 * Paths that must never appear in the Google News sitemap. The news sitemap
 * lists only articles, but we exclude these defensively so a future change to
 * article generation can never leak a monetized/legal page into it.
 */
export const NEWS_SITEMAP_EXCLUDED = ['/tools-and-partners', '/sponsors', '/disclosure'] as const;

/** True when `pathOrSlug` (a site path or an article slug) must be kept out of the news sitemap. */
export function isNewsSitemapExcluded(pathOrSlug: string): boolean {
  const clean = `/${String(pathOrSlug).replace(/^\/+|\/+$/g, '')}`.toLowerCase();
  return NEWS_SITEMAP_EXCLUDED.some((p) => clean === p || clean.startsWith(`${p}/`));
}

/** The disclosure line to render for a partner: its override, else the fixed FTC text. */
export function disclosureFor(partner: Partner): string {
  // `??` (not `||`) so an explicit empty-string override is honoured as "no
  // disclosure" and therefore refused, rather than silently replaced.
  return partner.disclosure ?? DISCLOSURE_TEXT;
}

/**
 * Throw if a compensated link would render without disclosure text.
 *
 * This is the "refuse to render" enforcement point. In normal operation it
 * never fires (the component supplies `DISCLOSURE_TEXT`); it fires if a
 * compensated entry carries a blank disclosure override, which would publish
 * an undisclosed paid link.
 */
export function assertPartnerDisclosure(partner: Partner): void {
  if (partner.compensated && disclosureFor(partner).trim() === '') {
    throw new Error(
      `PartnerLink: refusing to render compensated partner "${partner.name}" without disclosure text.`,
    );
  }
}

/** `rel` for a partner link. Compensated links always carry sponsored+nofollow. */
export function relFor(partner: Partner): string {
  return partner.compensated ? 'sponsored nofollow noopener' : 'noopener';
}
