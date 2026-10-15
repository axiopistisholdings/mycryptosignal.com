import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { DISCLOSURE_TEXT, commercialHosts, type Partner } from '../data/partners';
import {
  assertPartnerDisclosure,
  disclosureFor,
  relFor,
  isNewsSitemapExcluded,
  NEWS_SITEMAP_EXCLUDED,
} from '../lib/partners';
import { findFirewallViolations, isMonetizationSurface } from '../lib/firewall';

const componentsDir = fileURLToPath(new URL('../components', import.meta.url));

const compensated: Partner = {
  name: 'Example Analytics',
  url: 'https://example-analytics.test/signup',
  category: 'data',
  description: 'On-chain analytics for public chains.',
  compensated: true,
};

const free: Partner = {
  name: 'Open Explorer',
  url: 'https://open-explorer.test',
  category: 'data',
  description: 'A free block explorer.',
  compensated: false,
};

describe('partner link rules (the enforcement PartnerLink uses)', () => {
  it('gives every compensated link the FTC disclosure and sponsored rel', () => {
    expect(disclosureFor(compensated)).toBe(DISCLOSURE_TEXT);
    expect(relFor(compensated)).toBe('sponsored nofollow noopener');
  });

  it('never attaches a sponsored rel to a free listing', () => {
    expect(relFor(free)).toBe('noopener');
  });

  it('refuses a compensated entry with blank disclosure text', () => {
    expect(() => assertPartnerDisclosure({ ...compensated, disclosure: '' })).toThrow(
      /refusing to render compensated/,
    );
  });

  it('allows a compensated entry whose disclosure is present', () => {
    expect(() => assertPartnerDisclosure(compensated)).not.toThrow();
  });

  it('derives the commercial host set from the data file', () => {
    expect(commercialHosts([compensated, free])).toEqual([
      'example-analytics.test',
      'open-explorer.test',
    ]);
  });
});

describe('PartnerLink.astro is the only source of a commercial link', () => {
  const source = readFileSync(join(componentsDir, 'PartnerLink.astro'), 'utf8');

  it('routes every link through the disclosure guard', () => {
    expect(source).toContain('assertPartnerDisclosure');
  });

  it('emits the sponsored rel, a new tab target, and the disclosure', () => {
    expect(source).toMatch(/rel=\{rel\}|rel="sponsored/);
    expect(source).toContain('target');
    expect(source).toContain('partner-disclosure');
  });

  it('is the only component that emits a sponsored rel', () => {
    const offenders = readdirSync(componentsDir)
      .filter((f) => f.endsWith('.astro') && f !== 'PartnerLink.astro')
      .filter((f) => readFileSync(join(componentsDir, f), 'utf8').includes('sponsored'));
    expect(offenders).toEqual([]);
  });
});

describe('commercial firewall guard', () => {
  const hosts = ['example-analytics.test'];

  it('catches a deliberately-injected violation outside the monetization surface', () => {
    const files = [
      { path: 'index.html', content: '<a href="https://example-analytics.test/signup">x</a>' },
      { path: 'signals/btc/index.html', content: '<p>Rising</p>' },
    ];
    expect(findFirewallViolations(files, hosts)).toEqual([
      { file: 'index.html', host: 'example-analytics.test' },
    ]);
  });

  it('permits the same host on /tools-and-partners/', () => {
    const files = [
      { path: 'tools-and-partners/index.html', content: 'https://example-analytics.test/signup' },
    ];
    expect(findFirewallViolations(files, hosts)).toEqual([]);
  });

  it('passes a clean build', () => {
    const files = [
      { path: 'index.html', content: '<p>Data, not advice.</p>' },
      { path: 'news/foo/index.html', content: '<p>Steady</p>' },
    ];
    expect(findFirewallViolations(files, hosts)).toEqual([]);
  });

  it('recognises the monetization surface path forms', () => {
    expect(isMonetizationSurface('tools-and-partners/index.html')).toBe(true);
    expect(isMonetizationSurface('/tools-and-partners/index.html')).toBe(true);
    expect(isMonetizationSurface('index.html')).toBe(false);
    expect(isMonetizationSurface('disclosure/index.html')).toBe(false);
  });
});

describe('news sitemap exclusion', () => {
  it('excludes the monetized and disclosure pages', () => {
    for (const path of NEWS_SITEMAP_EXCLUDED) {
      expect(isNewsSitemapExcluded(path)).toBe(true);
      expect(isNewsSitemapExcluded(`${path}/`)).toBe(true);
    }
  });

  it('does not exclude ordinary articles', () => {
    expect(isNewsSitemapExcluded('/news/some-story')).toBe(false);
    expect(isNewsSitemapExcluded('/market/2026-10-12')).toBe(false);
  });
});
