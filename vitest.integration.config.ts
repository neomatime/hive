import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Separate from vitest.config.ts on purpose: that config's `test.exclude`
// deliberately excludes `tests/integration/**` (added in Task 8) so that the
// default `npm test` / `test:watch` runs -- which developers and CI run
// constantly -- never accidentally hit the live Supabase project. Because
// Vitest's file discovery applies `exclude` before CLI path filters (a CLI
// arg like `tests/integration` only narrows an already-discovered set, it
// can't resurrect files the config excluded -- confirmed empirically: `vitest
// run tests/integration` against the main config reports "No test files
// found"), `npm run test:integration` needs its own config that doesn't
// exclude that directory, rather than weakening the shared one.
//
// `environment: 'node'` (not jsdom): these tests only talk to Supabase over
// HTTP via real Node fetch and render no components, so there's no reason to
// pay for/risk a DOM shim here.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['./vitest.integration.setup.ts'],
  },
  resolve: {
    // import.meta.dirname (not __dirname) -- this file is loaded as ESM
    // ("type": "module" in package.json). Matches vitest.config.ts.
    alias: { '@': path.resolve(import.meta.dirname, '.') },
  },
})
