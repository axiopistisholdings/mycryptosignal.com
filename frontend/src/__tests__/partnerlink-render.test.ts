import { describe, it, expect, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';

// REAL render test. The Astro Container API needs a Vite version this repo's
// Vitest does not run, so this drives an actual `astro build` (Astro's own Vite)
// against a throwaway fixture project that renders the real PartnerLink.astro.
// It proves PartnerLink refuses a compensated link with no disclosure text, and
// that a properly-disclosed one renders the mandated attributes.

const root = fileURLToPath(new URL('../../', import.meta.url));
const astroBin = join(root, 'node_modules', 'astro', 'astro.js');
const componentAbs = join(root, 'src', 'components', 'PartnerLink.astro');

const tmp = mkdtempSync(join(root, 'test-fixture-'));
const pagesDir = join(tmp, 'src', 'pages');
mkdirSync(pagesDir, { recursive: true });
writeFileSync(
  join(tmp, 'astro.config.mjs'),
  "import { defineConfig } from 'astro/config';\n" +
    "export default defineConfig({ srcDir: './src', outDir: './out', output: 'static', build: { format: 'directory' } });\n",
);

const importPath = relative(pagesDir, componentAbs).split(sep).join('/');

function buildPage(pageName: string, partnerLiteral: string): { ok: boolean; output: string } {
  // Only one page may exist per build, or a failing page fails the whole build.
  for (const f of ['good.astro', 'bad.astro']) {
    rmSync(join(pagesDir, f), { force: true });
  }
  rmSync(join(tmp, 'out'), { recursive: true, force: true });

  writeFileSync(
    join(pagesDir, pageName),
    `---\nimport PartnerLink from '${importPath}';\nconst partner = ${partnerLiteral};\n---\n` +
      `<html><body><ul><PartnerLink partner={partner} /></ul></body></html>\n`,
  );

  try {
    const out = execFileSync(process.execPath, [astroBin, 'build'], {
      cwd: tmp,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return { ok: true, output: out };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { ok: false, output: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

describe('PartnerLink.astro real render', () => {
  it('renders a compensated link with the disclosure and mandated attributes', () => {
    const { ok, output } = buildPage(
      'good.astro',
      `{ name: 'Example Analytics', url: 'https://example-analytics.test/signup', category: 'data', description: 'On-chain analytics.', compensated: true }`,
    );
    expect(ok, `build failed:\n${output}`).toBe(true);

    const html = readFileSync(join(tmp, 'out', 'good', 'index.html'), 'utf8');
    expect(html).toContain('href="https://example-analytics.test/signup"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="sponsored nofollow noopener"');
    expect(html).toContain('we earn a commission if you sign up');
  });

  it('refuses to render a compensated link without disclosure text', () => {
    const { ok, output } = buildPage(
      'bad.astro',
      `{ name: 'Undisclosed Partner', url: 'https://undisclosed.test/signup', category: 'data', description: 'No disclosure.', compensated: true, disclosure: '' }`,
    );
    expect(ok).toBe(false);
    expect(output).toContain('refusing to render compensated');
  });
});

afterAll(() => {
  if (existsSync(tmp)) rmSync(tmp, { recursive: true, force: true });
});
