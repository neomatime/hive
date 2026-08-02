import path from 'node:path'

// Vite/Vitest's built-in .env loading (see vitest.config.ts comments) only
// auto-exposes keys prefixed `VITE_`, to avoid leaking arbitrary secrets into
// client bundles. This project's Supabase env vars use Next.js's
// `NEXT_PUBLIC_*` / bare-name convention instead (see .env.example,
// lib/supabase/admin.ts), so none of them land in `process.env` by default
// under Vitest -- confirmed empirically: without this, `createAdminClient()`
// throws "supabaseUrl is required." before any test body runs, because
// `process.env.NEXT_PUBLIC_SUPABASE_URL` is `undefined`.
//
// These are integration tests hitting the real project over plain Node
// fetch, not a client bundle, so there's no leakage concern -- load
// `.env.local` straight into `process.env` via Node's built-in loader
// (stable since Node 21.7, no extra dependency needed).
process.loadEnvFile(path.resolve(import.meta.dirname, '.env.local'))
