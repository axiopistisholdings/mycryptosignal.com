// The commercial/affiliate firewall, enforced against the BUILT output.
//
// A "commercial host" is any host named in `data/partners.ts`. It is allowed
// to appear in the built HTML ONLY on the single monetization surface,
// `/tools-and-partners/`. Anywhere else it is a violation — this is what makes
// the separation real rather than aspirational.
//
// Pure and filesystem-free so it can be unit-tested; the CLI wrapper
// (`scripts/check-commercial-firewall.ts`) reads `apps/web/dist` and calls it.

export interface BuiltFile {
  /** Path as reported to the caller (e.g. `tools-and-partners/index.html`). */
  path: string;
  /** File contents, decoded as UTF-8 text. */
  content: string;
}

export interface FirewallViolation {
  file: string;
  host: string;
}

/** The one path where a commercial host is permitted. */
export const MONETIZATION_SURFACE = '/tools-and-partners/';

/**
 * Where a SPONSOR host may appear. A sponsor link is legitimate on the brief
 * pages (the sponsor unit lives there) and on the rate card — and nowhere else.
 * In particular it must never reach a `/signals/` page, where direction words
 * live, nor the homepage or any news page. This is a deliberately tighter rule
 * than "everywhere": it is what stops a sponsor link drifting next to a signal.
 */
export const SPONSOR_SURFACES = ['/sponsors/', '/market/'] as const;

/** True when a built-file path is the monetization surface (or inside it). */
export function isMonetizationSurface(filePath: string): boolean {
  const p = `/${String(filePath).replace(/\\/g, '/').replace(/^\/+/, '')}`.toLowerCase();
  return p.startsWith(MONETIZATION_SURFACE);
}

/** True when `filePath` is at or under any of `surfaces`. */
export function isUnderAnySurface(filePath: string, surfaces: readonly string[]): boolean {
  const p = `/${String(filePath).replace(/\\/g, '/').replace(/^\/+/, '')}`.toLowerCase();
  return surfaces.some((s) => p.startsWith(s));
}

/**
 * Return every place a watched host appears OUTSIDE the surfaces it is allowed
 * on. Matching is a case-insensitive substring test on the whole file text, so a
 * host in an inline script, JSON island or a `href` is caught alike.
 */
export function findHostsOutsideSurfaces(
  files: BuiltFile[],
  hosts: string[],
  allowedSurfaces: readonly string[],
): FirewallViolation[] {
  const wanted = [...new Set(hosts.map((h) => h.toLowerCase().trim()).filter(Boolean))];
  const violations: FirewallViolation[] = [];
  if (wanted.length === 0) return violations;

  for (const file of files) {
    if (isUnderAnySurface(file.path, allowedSurfaces)) continue;
    const haystack = file.content.toLowerCase();
    for (const host of wanted) {
      if (haystack.includes(host)) violations.push({ file: file.path, host });
    }
  }
  return violations;
}

/**
 * Return every place a commercial host leaks outside the monetization surface.
 * Matching is a case-insensitive substring test on the whole file text, so a
 * host in an inline script, JSON island or a `href` is caught alike.
 */
export function findFirewallViolations(files: BuiltFile[], hosts: string[]): FirewallViolation[] {
  return findHostsOutsideSurfaces(files, hosts, [MONETIZATION_SURFACE]);
}

/** Return every place a SPONSOR host leaks outside its sanctioned surfaces. */
export function findSponsorViolations(files: BuiltFile[], hosts: string[]): FirewallViolation[] {
  return findHostsOutsideSurfaces(files, hosts, SPONSOR_SURFACES);
}
