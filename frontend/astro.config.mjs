// @ts-check
import { defineConfig } from 'astro/config';

// MyCryptoSignal unified site — static output, deployable to Cloudflare Pages.
// API base URL + optional public read token come from env vars (build-time),
// defaulting to the MyCryptoSignal worker. NEVER put a secret here.
const API_BASE =
  process.env.PUBLIC_API_BASE || 'https://api.mycryptosignal.workers.dev';

export default defineConfig({
  site: 'https://mycryptosignal.com',
  output: 'static',
  build: {
    // Clean URLs (no `.html`) — matches the PRD IA (/signals, /news, /prices …).
    format: 'directory',
  },
  trailingSlash: 'ignore',
  env: {
    schema: {
      PUBLIC_API_BASE: { type: 'string', access: 'public', context: 'client', optional: true, default: API_BASE },
      // A public read-only token, NOT a secret; injected at build time. Empty →
      // authenticated API calls return 401 and pages render their empty state.
      PUBLIC_API_KEY: { type: 'string', access: 'public', context: 'client', optional: true, default: '' },
    },
  },
  compressHTML: true,
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
});
