import { describe, it, expect, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';
import { SPONSORS as WEB_SPONSORS } from '../data/sponsors';
import { findSponsorViolations, findHostsOutsideSurfaces, SPONSOR_SURFACES } from '../lib/firewall';

const componentsDir = fileURLToPath(new URL('../components', import.meta.url));
const dataDir = fileURLToPath(new URL('../data', import.meta.url));

// ---------------------------------------------------------------------------
// Sponsor data is self-contained in this repo
// ---------------------------------------------------------------------------

describe('sponsor data is self-contained', () => {
  it('the web module defines its own list (no cross-package import)', () => {
    const src = readFileSync(join(dataDir, 'sponsors.ts'), 'utf8');
    expect(src).toContain('export const SPONSORS');
    expect(src).not.toContain('packages/core');
  });

  it('ships empty — no paid placements', () => {
    expect(WEB_SPONSORS).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// SponsorUnit is the only component that can emit a sponsored placement
// ---------------------------------------------------------------------------

describe('SponsorUnit.astro is the only source of a sponsored unit', () => {
  const source = readFileSync(join(componentsDir, 'SponsorUnit.astro'), 'utf8');

  it('emits the commercial marker, the mandated rel/target and the campaign tag', () => {
    expect(source).toContain('data-sponsor-unit');
    expect(source).toContain('SPONSOR_MARKER');
    expect(source).toContain('SPONSOR_REL');
    expect(source).toContain('SPONSOR_TARGET');
    expect(source).toContain('sponsorCampaignUrl');
  });

  it('is the only component that emits a sponsored unit', () => {
    const offenders = readdirSync(componentsDir)
      .filter((f) => f.endsWith('.astro') && f !== 'SponsorUnit.astro')
      .filter((f) => readFileSync(join(componentsDir, f), 'utf8').includes('data-sponsor-unit'));
    expect(offenders).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Firewall — a sponsor host is allowed only on the brief pages and the rate card
// ---------------------------------------------------------------------------

describe('sponsor firewall guard', () => {
  const host = 'example-analytics.test';

  it('permits a sponsor host on a brief page and on the rate card', () => {
    const files = [
      { path: 'market/2026-10-15/index.html', content: `<a href="https://${host}/?from=x">x</a>` },
      { path: 'sponsors/index.html', content: `<a href="https://${host}/?from=x">x</a>` },
    ];
    expect(findSponsorViolations(files, [host])).toEqual([]);
  });

  it('FAILS if a sponsor host reaches a signal page, the homepage or news', () => {
    const files = [
      { path: 'signals/btc/index.html', content: `<a href="https://${host}/">x</a>` },
      { path: 'index.html', content: `https://${host}` },
      { path: 'news/foo/index.html', content: `https://${host}` },
    ];
    const v = findSponsorViolations(files, [host]);
    expect(v.map((x) => x.file).sort()).toEqual([
      'index.html',
      'news/foo/index.html',
      'signals/btc/index.html',
    ]);
  });

  it('does not match a path that merely starts with the surface word', () => {
    // `/marketstreet/` must not be treated as `/market/`.
    const files = [{ path: 'marketstreet/index.html', content: `https://${host}` }];
    expect(findSponsorViolations(files, [host])).toEqual([
      { file: 'marketstreet/index.html', host },
    ]);
  });

  it('exposes the sanctioned surfaces', () => {
    expect(SPONSOR_SURFACES).toContain('/market/');
    expect(SPONSOR_SURFACES).toContain('/sponsors/');
  });

  it('is a no-op when there are no sponsors (the shipped state)', () => {
    const files = [{ path: 'index.html', content: 'nothing' }];
    expect(findHostsOutsideSurfaces(files, [], SPONSOR_SURFACES)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// REAL render — structural separation, proven against an actual Astro build
// ---------------------------------------------------------------------------

const root = fileURLToPath(new URL('../../', import.meta.url));
const astroBin = join(root, 'node_modules', 'astro', 'astro.js');
const componentAbs = join(componentsDir, 'SponsorUnit.astro');

const tmp = mkdtempSync(join(root, 'test-fixture-'));
const pagesDir = join(tmp, 'src', 'pages');
mkdirSync(pagesDir, { recursive: true });
writeFileSync(
  join(tmp, 'astro.config.mjs'),
  "import { defineConfig } from 'astro/config';\n" +
    "export default defineConfig({ srcDir: './src', outDir: './out', output: 'static', build: { format: 'directory' } });\n",
);

const importPath = relative(pagesDir, componentAbs).split(sep).join('/');

const SPONSOR_LITERAL =
  "{ name: 'Example Analytics', slug: 'example-analytics', url: 'https://example-analytics.test/', blurb: 'On-chain analytics.', startsOn: '2026-10-01', endsOn: '2026-10-31', active: true }";

// A page with a real signal block (direction word + coin table) AND the sponsor
// unit, in its own sibling section — the shape the brief page uses.
function pageBody(sponsorExpr: string): string {
  return `---
import SponsorUnit from '${importPath}';
const sponsor = ${sponsorExpr};
---
<html><body><main>
<section class="signals">
  <h2>Today's signals</h2>
  <p>BTC is Rising, ETH is Steady.</p>
  <table><thead><tr><th>Coin</th></tr></thead><tbody><tr><td>BTC</td></tr></tbody></table>
</section>
<section data-sponsor-section><SponsorUnit sponsor={sponsor} /></section>
</main></body></html>
`;
}

function buildPages(): { ok: boolean; output: string } {
  rmSync(join(tmp, 'out'), { recursive: true, force: true });
  writeFileSync(join(pagesDir, 'on.astro'), pageBody(SPONSOR_LITERAL));
  writeFileSync(join(pagesDir, 'off.astro'), pageBody('null'));
  try {
    const out = execFileSync(process.execPath, [astroBin, 'build'], {
      cwd: tmp,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return { ok: true, output: out };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    return { ok: false, output: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

const build = buildPages();

/** The unit's own HTML: from `data-sponsor-unit` to its closing `</aside>`. */
function unitHtml(html: string): string {
  const start = html.indexOf('data-sponsor-unit');
  if (start < 0) return '';
  const end = html.indexOf('</aside>', start);
  return html.slice(start, end < 0 ? html.length : end);
}

describe('SponsorUnit.astro real render — the site brief block', () => {
  it('builds', () => {
    expect(build.ok, `astro build failed:\n${build.output}`).toBe(true);
  });

  it('renders the labelled unit with the mandated attributes and campaign tag', () => {
    const html = readFileSync(join(tmp, 'out', 'on', 'index.html'), 'utf8');
    expect(html).toContain('data-sponsor-unit="true"');
    expect(html).toContain('rel="sponsored nofollow noopener"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('from=example-analytics');
    expect(html).toMatch(/Sponsored/i);
    expect(html).toContain('Paid placement');
  });

  it('STRUCTURAL: the sponsor link lives ONLY inside the sponsored unit', () => {
    const html = readFileSync(join(tmp, 'out', 'on', 'index.html'), 'utf8');
    const unit = unitHtml(html);
    expect(unit).toContain('example-analytics.test');

    const withoutUnit = html.replace(unit, '');
    expect(withoutUnit).not.toContain('example-analytics.test');
    expect(withoutUnit).not.toContain('data-sponsor-unit');
  });

  it('STRUCTURAL: the sponsored unit shares no section with a signal or direction word', () => {
    const html = readFileSync(join(tmp, 'out', 'on', 'index.html'), 'utf8');
    const unit = unitHtml(html);
    // The unit must not contain a direction word or a coin table.
    expect(unit).not.toMatch(/\b(Rising|Falling|Steady|Choppy)\b/i);
    expect(unit).not.toMatch(/<table/i);

    // The signal section is a separate element and contains no sponsor content.
    const signalSection = html.slice(
      html.indexOf('<section class="signals"'),
      html.indexOf('</section>', html.indexOf('<section class="signals"')),
    );
    expect(signalSection).toMatch(/Rising/);
    expect(signalSection).not.toContain('example-analytics.test');
    expect(signalSection).not.toContain('data-sponsor-unit');
  });

  it('renders NOTHING at all when the sponsor is null', () => {
    const html = readFileSync(join(tmp, 'out', 'off', 'index.html'), 'utf8');
    expect(html).not.toContain('data-sponsor-unit');
    expect(html).not.toContain('example-analytics.test');
    expect(html).not.toMatch(/Sponsored/i);
    // The signal section still renders — nothing about the page is broken.
    expect(html).toMatch(/Rising/);
  });
});

afterAll(() => {
  if (existsSync(tmp)) rmSync(tmp, { recursive: true, force: true });
});
