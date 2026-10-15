// Sponsor data for the web app — self-contained copy for the public repo.
//
// A sponsor is a COMMERCIAL placement. It renders ONLY as its own clearly
// labelled, physically separated block — never inside, beside, or adjacent to a
// signal, a direction word (Rising/Falling/Steady/Choppy), a coin table, brief
// data or a news digest.
//
// SHIPS EMPTY. An absent, inactive or expired sponsor renders NOTHING — never
// an empty box and never a placeholder.

export interface Sponsor {
  /** Display name shown in the unit — what a reader sees. */
  name: string;
  /**
   * Stable identifier, lower-case, used as the campaign tag (`?from=<slug>`) so
   * our own analytics can count arrivals from this placement.
   */
  slug: string;
  /** The sponsor's own destination. Opens in a new tab with a sponsored rel. */
  url: string;
  /** Optional one short line of copy. Kept short; no superlatives, no advice. */
  blurb?: string;
  /** First day the sponsor may appear, inclusive (`YYYY-MM-DD`, UTC). */
  startsOn: string;
  /** Last day the sponsor may appear, inclusive (`YYYY-MM-DD`, UTC). */
  endsOn: string;
  /** Master switch. `false` disables the unit regardless of the date range. */
  active: boolean;
}

/**
 * The live sponsor list.
 *
 * INTENTIONALLY EMPTY. We hold no paid placements yet, so we publish nothing
 * rather than a placeholder. The site renders no unit at all while this is
 * empty.
 */
export const SPONSORS: Sponsor[] = [];

/**
 * Date range is INCLUSIVE at both ends, compared lexically on `YYYY-MM-DD`
 * (which is a total order for zero-padded ISO dates). `active` is a hard gate
 * that wins over the range.
 */
export function isSponsorLive(sponsor: Sponsor, day: string): boolean {
  if (!sponsor.active) return false;
  return sponsor.startsOn <= day && day <= sponsor.endsOn;
}

/** The first live sponsor for `day`, or `null`. `day` is `YYYY-MM-DD` (UTC). */
export function findActiveSponsor(day: string, sponsors: Sponsor[] = SPONSORS): Sponsor | null {
  for (const s of sponsors) if (isSponsorLive(s, day)) return s;
  return null;
}

/**
 * The sponsor's destination with its `?from=<slug>` campaign tag appended.
 * Preserves any query the sponsor's URL already carries (uses `&` when a query
 * is present) and strips a trailing `?`/`#` fragment boundary correctly.
 */
export function sponsorCampaignUrl(sponsor: Sponsor): string {
  const url = sponsor.url;
  const from = `from=${encodeURIComponent(sponsor.slug)}`;
  const hashIndex = url.indexOf('#');
  const base = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}${from}${hash}`;
}

/** The visible commercial marker, exactly as printed at the point of contact. */
export const SPONSOR_MARKER = 'Sponsored';

/** The secondary label that spells out what the marker means. */
export const SPONSOR_LABEL = 'Partner message';

/**
 * The per-placement disclosure, printed immediately adjacent to the link. It
 * states plainly that the placement was paid for and that the editorial content
 * beside it is not.
 */
export const SPONSOR_DISCLOSURE =
  'Paid placement by the sponsor named above. Our briefs, signals and news are never for sale.';

/** `rel` on every sponsor link: sponsored + nofollow + noopener. */
export const SPONSOR_REL = 'sponsored nofollow noopener';

/** `target` on every sponsor link. */
export const SPONSOR_TARGET = '_blank';
