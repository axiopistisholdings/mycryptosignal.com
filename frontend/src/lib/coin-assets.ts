// SERVER-ONLY: resolves which coin icons actually exist on disk at build time.
//
// The icon set lives in `public/coins/<coin_id>.{png,svg}` (the file naming *is*
// the mapping — see docs/brand/coin-icons.md). The ingest prefers SVG where the
// owner supplied one, so the committed set is a mix of both; we resolve the real
// file per coin. This runs once, during the Astro build, so every page can render
// either the <img> or an honest monogram fallback — never a broken image and never
// a client-side onerror.
//
// Never import this from a browser <script>: it uses node:fs and is only reachable
// from Astro frontmatter / other server-only modules.
import { readdirSync } from 'node:fs';

/** coin_id → the actual asset filename, e.g. `bitcoin.svg` or `bonus.png`. */
let cache: Map<string, string> | null = null;

/** Resolve `apps/web/public/coins/` from this module's own location. */
function coinsDir(): URL {
  return new URL('../../public/coins/', import.meta.url);
}

/** The set of coin assets on disk, keyed by coin_id. SVG is preferred when both exist. */
export function coinIconFiles(): Map<string, string> {
  if (cache) return cache;
  const map = new Map<string, string>();
  try {
    for (const name of readdirSync(coinsDir())) {
      const m = /^(.+)\.(png|svg)$/i.exec(name);
      if (!m) continue;
      const id = m[1];
      const ext = m[2].toLowerCase();
      if (id === 'fallback') continue; // a shared placeholder, not a coin
      // Prefer SVG: a vector is crisper at every size and smaller for simple marks
      // (see docs/brand/coin-icons.md). The build writes exactly one file per coin,
      // so this only matters if a future run ever emits both.
      if (ext === 'svg' || !map.has(id)) map.set(id, `${id}.${ext}`);
    }
  } catch {
    // Unreadable in an unusual sandbox: everything falls back to the monogram
    // rather than emitting image URLs that would 404.
  }
  cache = map;
  return map;
}

/** The filename (`bitcoin.svg`) for a coin, or null when there is no icon at all. */
export function coinIconFile(coinId: string | null | undefined): string | null {
  if (typeof coinId !== 'string' || coinId === '') return null;
  return coinIconFiles().get(coinId) ?? null;
}
