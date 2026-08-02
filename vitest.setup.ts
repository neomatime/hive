import '@testing-library/jest-dom/vitest'
import { afterEach, expect } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as axeMatchers from 'vitest-axe/matchers'
import type { NoViolationsMatcherResult } from 'vitest-axe/matchers'

// vitest-axe (0.1.0) ships its runtime matcher and its TypeScript types as
// two separate halves, and neither half is wired up the way its own README
// / the original task brief assumed for this project's Vitest version:
//
// 1. Runtime: `vitest-axe/matchers` exports the `toHaveNoViolations`
//    function, but -- unlike jest-dom's `/vitest` entry point above, which
//    self-registers -- vitest-axe never calls `expect.extend` for us. Left
//    out, `.toHaveNoViolations()` would throw "not a function" at runtime
//    even though it type-checks. Done by hand below, per vitest-axe's
//    README "Usage" section.
//
// 2. Types: vitest-axe also ships a `vitest-axe/extend-expect` entry meant
//    to add `.toHaveNoViolations()` to Vitest's `expect(...)` return type --
//    but its .d.ts augments a global `Vi.Assertion` namespace, which is
//    stale: Vitest 4 (installed here) exposes `Assertion<T>` as a plain
//    interface exported from the `vitest` module itself, extended via
//    module augmentation (see @testing-library/jest-dom's own
//    node_modules/@testing-library/jest-dom/types/vitest.d.ts for the
//    identical pattern already working for the jest-dom matchers above).
//    Importing `vitest-axe/extend-expect` compiles (its compiled .js is an
//    intentionally-empty module) but silently changes nothing, so
//    `.toHaveNoViolations()` still fails to type-check. Re-declared here
//    against the interface Vitest 4 actually consults. The member is
//    inlined (rather than `extends AxeMatchers`, vitest-axe's own type)
//    because an empty interface body that only extends one other type trips
//    this repo's `@typescript-eslint/no-empty-object-type` rule.
declare module 'vitest' {
  // `T` must stay exactly `= any` -- verified empirically that any other
  // default (including omitting it) fails with TS2428 "All declarations of
  // 'Assertion' must have identical type parameters" against
  // @vitest/expect's own `interface Assertion<T = any>`. `toHaveNoViolations`
  // itself doesn't depend on T, matching vitest-axe's own non-generic
  // `AxeMatchers` type -- hence the otherwise-unused type param below.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  interface Assertion<T = any> {
    toHaveNoViolations(): NoViolationsMatcherResult
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): NoViolationsMatcherResult
  }
}

expect.extend(axeMatchers)

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
