# HIVE Visual Upgrade — Phase 1: Shared Foundation

**Status:** Approved (brainstorm), pending implementation plan
**Date:** 2026-08-06
**Supersedes (in part):** `docs/design/design-system.md` §2.1 (density language), §3.2 and §3.5 (Ocean Light's documented role, colour distribution), §6.2 (Sidebar — currently hard-codes `background: #8aadb8` / Ocean Light, plus the selected/hover/default item rules); `docs/design/color-palette.md` §4 (Colour Distribution) and §5 (UI Mapping, Sidebar row)

## 1. Problem

HIVE's Foundation phase and subsequent "editorial pass" (PR #30, 2026-08-04) established a calm, minimal, brand-colored identity (Newsreader serif + Geist Mono + hairline rules), but the user's assessment is that it still doesn't read as a "world-class," "high-end" project management product. This spec covers the first phase of closing that gap: the shared visual foundation every page inherits from (color system, sidebar/topbar shell, and core UI primitives), not a page-by-page redesign.

## 2. Goals

- Elevate HIVE's *own* identity (navy/ocean palette, editorial type system) rather than adopt another product's look wholesale.
- Ship a real, properly-built light/dark theme, not a bolt-on.
- Tighten spacing/density without abandoning HIVE's calm, uncluttered character.
- Fix a real inconsistency along the way: shared UI patterns (dialogs, badges) are currently hand-rolled per call site rather than shared components, which is exactly what makes a from-scratch dark-mode pass risky (N places to get wrong instead of one).

## 3. Non-goals (explicitly out of scope for this phase)

- Redesigning individual page layouts (Overview, Board, Calendar, Files, Search, Inbox, Settings) beyond swapping in the new tokens/primitives. Each gets its own follow-up phase/spec once this foundation ships.
- Any new product features or behavior changes — this is visual only.
- Real OAuth for Integrations (already separately deferred).
- `.auth-dark` (the login screen's dark treatment) — it's a distinct pre-auth surface with its own prior design decision, not part of the new app-wide theme toggle.

## 4. Design direction

Confirmed via brainstorm (including two rounds of visual mockups, both approved as-is):

- **Sidebar becomes a permanent dark "Ink Panel"** — always dark-toned regardless of which canvas theme (light/dark) is active, the way Linear/Vercel/Height do it. This is the single biggest visual change in this phase.
- **Canvas (main content area) gets a real light and dark theme**, toggleable, independent of the sidebar.
- **Density: "calm but tightened."** Not a shift to Linear-style high density — HIVE's spaciousness stays — but padding/rhythm gets more deliberate and less loose.
- **Signature/through-line:** Geist Mono for every instrument value (dates, counts, percentages, file sizes, IDs), consistently applied against the dark Ink Panel chrome. Reinforces the existing "ledger" character rather than introducing a new gimmick.

## 5. Color tokens

### 5.1 Sidebar (theme-adaptive, always dark)

| Canvas theme | Sidebar background |
|---|---|
| Light | `#0e1822` (Ink Deep) |
| Dark | `#1c2b3a` (Midnight) — one step lighter than the dark canvas, for quiet depth without a border or shadow |

This replaces the current `--background-sidebar: var(--color-ocean-light)` mapping, which was theme-static (same medium-teal regardless of app theme). The sidebar's own text/nav-item colors also stop varying by theme — they're tuned once against a dark background: `#8aa0ac` (inactive nav text), `#ffffff` (active nav text), `rgba(95,129,144,0.22)` (active-item background tint).

**Deviation from the approved mockup:** the mockup's abstract dot marker (a stand-in for "some visual indicator," since the mockup didn't render real per-item icons) was dropped during implementation. HIVE's sidebar already has a meaningful Lucide icon per nav item; adding a decorative dot alongside a perfectly legible icon would be pure decoration with no informational value, which cuts against design-system.md §2.1's "avoid unnecessary decoration" principle. The tinted-pill background plus icon/text color change is sufficient to communicate selection on its own.

### 5.2 Canvas — light (mostly unchanged, listed for completeness)

| Token | Value |
|---|---|
| `--background-app` | `#f7f7f5` |
| `--background-surface` | `#ffffff` |
| `--text-primary` | `#0e1822` |
| `--text-muted` | `#77838c` (existing `--neutral-600`) |
| `--border-default` | `#dce1e4` (existing `--neutral-200`) |

### 5.3 Canvas — dark (new)

| Token | Value |
|---|---|
| `--background-app` (dark) | `#0e1822` (Ink Deep) |
| `--background-surface` (dark) | `#1c2b3a` (Midnight) |
| `--text-primary` (dark) | `#ffffff` |
| `--text-secondary` (dark) | `#b7c3ca` |
| `--text-muted` (dark) | `#8aa0ac` |
| `--border-default` (dark) | `rgba(255,255,255,0.12)` |
| `--border-subtle` (dark) | `rgba(255,255,255,0.08)` |

### 5.4 Semantic colors (badges, alerts) — both themes

Same hue family in both themes; dark mode lightens the text and drops the background to a low-opacity tint rather than reusing the light-mode solid-ish tint:

| Semantic | Light text / bg | Dark text / bg |
|---|---|---|
| Danger | `#9a4e4e` / `rgba(154,78,78,0.1)` | `#e2a3a3` / `rgba(220,140,140,0.16)` |
| Warning | `#9a7436` / `rgba(154,116,54,0.1)` | `#e0c090` / `rgba(220,180,120,0.16)` |
| Success | `#3f6b5a` / `rgba(63,107,90,0.1)` | `#9fcdb8` / `rgba(140,200,170,0.16)` |
| Info/Ocean | `#2e4a5a` / `rgba(95,129,144,0.12)` | `#b9d3da` / `rgba(138,173,184,0.18)` |

### 5.5 Implementation note

`styles/global.css` already has a `.dark` class block — it's dead shadcn boilerplate (generic near-black oklch values) that has never been toggled anywhere in the app. This phase repurposes that exact class name with the real values above, rather than introducing a new one. `.auth-dark` is untouched (see Non-goals).

## 6. Typography, spacing, radius, motion

- **No font changes.** Newsreader (h1), Geist (body), Geist Mono (data) stay exactly as-is in both themes — dark mode is a color remap only.
- **Spacing/radius scales are unchanged** (existing 8pt spacing scale; 6/8/10/14 radius scale from the prior editorial pass) — but *usage* tightens: table row padding, sidebar nav-item padding, and card/tile internal padding all get denser per the approved mockups (roughly 6–10px vertical rhythm inside rows/nav items, down from the current looser values — exact px audited per-component during implementation, not prescribed globally here).
- **Motion:** `--motion-fast: 120ms` already exists in `styles/theme.css` but is barely used. Phase 1b applies it to hover/press/focus micro-interactions (buttons, nav items, table rows) that currently snap instantly. `--motion-standard`/`--motion-easing` (page transitions) are untouched.

## 7. Shell (sidebar + topbar)

- Sidebar: Ink Panel treatment (§5.1). Active item = tinted background pill (not full-bleed fill) + white text/icon, no accent dot (see §5.1's noted deviation from the mockup).
- Topbar: structurally unchanged (breadcrumb left, search + notifications + avatar right), but padding tightens and any residual shadow is replaced by the hairline bottom border, consistent with the "hairlines not shadows" principle.
- **New: theme toggle.** A sun/moon icon button in the topbar. Persisted client-side only (localStorage, same `useSyncExternalStore` pattern already used for sidebar-collapse state — avoids the SSR-hydration mismatch that pattern was built to solve), *not* synced to the `user_preferences` table. This is a device-level display preference, same precedent as sidebar-collapse; it doesn't follow the user across devices. Default, when no stored preference exists, follows the visitor's `prefers-color-scheme`.

## 8. Primitives

- **Buttons/Inputs:** shapes stay as they are (transparent bordered inputs, hairline focus rings were already good). The real work is correctness: existing `dark:` Tailwind variants on `components/ui/button.tsx` / `input.tsx` were written against a palette that never activated — they need auditing against the real §5.3 values, not trusted as-is. Add the `--motion-fast` transition to hover/press states.
- **Cards/Tables:** hairline borders, tightened padding (§6), no shadows. Numeric columns (dates, counts, sizes, IDs) consistently right-aligned in Geist Mono — extending the partial pattern already in Overview/Files to every table in the app.
- **Badge (new shared component):** currently ad-hoc/inline per page (priority pills, status chips scattered across Board/Tasks). Formalize as `components/ui/badge.tsx` using the §5.4 tinted treatment, then migrate every existing ad-hoc badge-like element to it.
- **Dialog (new shared component):** currently hand-rolled per call site (`task-detail-dialog.tsx`, the team-member profile editor, the file-related dialogs each duplicate `fixed inset-0 z-50 grid place-items-center bg-black/40` + `role="dialog"` markup). Consolidate into `components/ui/dialog.tsx` — this directly serves the dark-mode pass, since otherwise the same styling fix would need to land in 3+ places independently. Modals keep a real shadow (`--shadow-lg`) — the one deliberate, already-documented exception to "hairlines not shadows," since an overlay needs actual elevation to read as above the page.
- **Tabs — deferred.** No tab-like navigation exists anywhere in the current app (confirmed via full-codebase search during Phase 1b planning); Settings, this section's original guess, is a card-grid landing page linking to sub-routes, not a tab bar. Building a shared component with no real consumer would be speculative. Revisit if/when a page redesign actually introduces tabbed navigation.

## 9. States

- **Empty states:** stay text-forward — icon (existing lucide-react usage) + heading + one line of muted body copy. No illustrations (consistent with design-system.md's existing anti-decoration principle). Audit for consistency across Board/Files/Search/Inbox.
- **Loading states:** real skeleton/shimmer placeholders shaped like the content they replace (card skeleton, table-row skeleton, tile skeleton), replacing any bare "Loading…" text. Shimmer animation respects `prefers-reduced-motion` (existing global rule already handles this for other animations).
- **Error states:** no change — the existing inline `role="alert"` red-text pattern is already consistent app-wide; it just needs re-theming for dark-mode contrast (§5.4 danger values).

## 10. Rollout

Two sub-phases, each shipped as one or more independently-mergeable PRs (matches this project's established pattern — small, tested, verified, merged):

- **1a — Tokens + shell:** §5, §7's sidebar/theme-toggle scope. Ships first; biggest single visible milestone (new color system, dead `.dark` block rewritten, Ink Panel sidebar, theme toggle).
- **1b — Primitives + states:** §6's density tightening (topbar/nav-item/table/card padding — moved here from 1a, since it touches the same primitives 1b already covers, rather than being audited piecemeal), §8–9. Likely 2–3 PRs (e.g., Badge+Dialog together, then table/card tightening, then loading-state skeletons).

## 11. Documentation updates

`docs/design/design-system.md` §6.2 currently hard-codes the sidebar rule explicitly — `background: #8aadb8` (Ocean Light), plus "Selected item: Midnight background with white text" / "Hover item: semi-transparent white background" / "Default item: Ink Deep text." All of that is superseded by §7 of this spec (dark sidebar, tinted-pill active state, white text throughout). §3.2 and §3.5 (Ocean Light's documented usage/percentage) and §2.1's density wording also need updating. `docs/design/color-palette.md` §4 (Colour Distribution) and §5 (UI Mapping, Sidebar row) get the matching updates.

This is not another §21-style exception footnote (the existing pattern for logged, approved deviations) — the sidebar color and density principle are changing at the foundation level, so this phase includes a real revision of the affected sections rather than an appended exception.

## 12. Testing & verification

Same discipline as the rest of this project:

- TDD for new component logic: the theme-persistence hook, `Badge`, `Dialog` components (`Tabs` deferred, see §8).
- Full `vitest` suite + `eslint` + `next build` gate before every merge.
- Computed-style WCAG contrast checks (`getComputedStyle` + contrast ratio, same technique used for the login-page fix earlier this session) run against real text/background pairs in *both* themes — not just visual inspection.
- Extend `tests/a11y/dashboard-shell.a11y.test.tsx` to cover dark mode.
- Manual verification in-browser via the existing preview tooling (screenshot/zoom tools have been unreliable all session; computed-style checks + accessibility-tree reads are the established fallback).

## 13. Open risk

Migrating every ad-hoc badge/dialog call site to the new shared components touches a non-trivial number of files across Board, Tasks, Team, and Files. This is scoped into 1b specifically so it can be broken into small, reviewable PRs rather than one sweeping change.
