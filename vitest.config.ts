import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['**/node_modules/**', 'tests/e2e/**', 'tests/integration/**'],
  },
  resolve: {
    // import.meta.dirname (not __dirname) -- this file is loaded as ESM
    // ("type": "module" in package.json), and Vite's native config loader
    // warns that __dirname support is deprecated and will be removed.
    alias: { '@': path.resolve(import.meta.dirname, '.') },
  },
})
