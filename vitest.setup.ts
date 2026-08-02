import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// @testing-library/react only self-registers its automatic afterEach
// cleanup when it detects a *global* `afterEach` (see its dist source:
// `if (typeof afterEach === 'function') { afterEach(cleanup) }`). Vitest
// does not install globals unless `test.globals: true` is set, and this
// project intentionally keeps that off (test files explicitly import
// `describe`/`it`/`expect`/`vi` from 'vitest', matching the existing
// services/**/*.test.ts convention) -- so RTL's internal check silently
// finds nothing and never wires up cleanup. Without this explicit
// registration, every rendered component stays mounted in `document.body`
// for the rest of the file, and any test file with more than one test that
// renders overlapping markup (e.g. two forms both labelled "Email") starts
// failing with "Found multiple elements" as soon as a second test runs.
afterEach(() => {
  cleanup()
})
