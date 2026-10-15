import { defineConfig } from 'vitest/config';

// Plain Vitest (no Astro Vite plugin: Astro 5 ships Vite 6 while this repo's
// Vitest 2 runs Vite 5 — they are incompatible). Pure firewall rules are tested
// here directly; the PartnerLink RENDER test drives a real `astro build` instead
// (see src/__tests__/partnerlink-render.test.ts), which uses Astro's own Vite.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
    testTimeout: 120_000,
  },
});
