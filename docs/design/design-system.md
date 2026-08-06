# HIVE Design System

## 1. Purpose

This document defines the visual and interaction standards for **HIVE**, HIMARK's internal project management tool.

The design system exists to ensure that every page, component, state, and interaction feels consistent across the application.

HIVE should feel:

- Clean
- Focused
- Calm
- Professional
- Minimal
- Fast
- Easy to understand

HIVE is not a generic SaaS dashboard. It is a focused internal tool for managing HIMARK projects, tasks, files, deadlines, and team activity.

---

## 2. Design Principles

### 2.1 Clarity over decoration

Every element must communicate a clear function.

Avoid:

- Unnecessary charts
- Decorative gradients
- Excessive shadows
- Random accent colours
- Cluttered, unstructured layouts
- Overloaded navigation

HIVE stays calm and uncluttered, but its spacing is deliberate rather than
loose -- see the 2026-08-06 design upgrade spec for the tightened rhythm
applied across tables, nav items, and cards.

### 2.2 One primary action per view

Each page should have one obvious primary action.

Examples:

- Projects: `New Project`
- Board: `New Task`
- Files: `Upload File`
- Calendar: `New Event`
- Team: `Invite Member`

Secondary actions should remain visually subordinate.

### 2.3 Work should remain central

HIVE exists to help the team execute work.

The interface should prioritise:

- Current projects
- Assigned tasks
- Due dates
- Kanban movement
- Team ownership
- Files
- Deadlines

### 2.4 Progressive disclosure

Show only the information needed for the current decision.

Detailed settings, metadata, history, and secondary actions should appear in:

- Drawers
- Modals
- Secondary panels
- Expandable sections
- Context menus

### 2.5 Consistency before novelty

Use existing patterns before creating new ones.

A new component should only be introduced when an existing component cannot reasonably support the required interaction.

---

## 3. Brand Foundation

## 3.1 Product name

```text
HIVE
```

Descriptor:

```text
HIMARK's internal project management platform
```

HIVE should be treated as a product name, not a forced acronym.

---

## 3.2 HIMARK Colour Palette

| Token                 | Name        |       Hex | Primary Use                                |
| --------------------- | ----------- | --------: | ------------------------------------------ |
| `--color-midnight`    | Midnight    | `#1C2B3A` | Primary buttons, headings, strong emphasis |
| `--color-ink-deep`    | Ink Deep    | `#0E1822` | Primary body text, high-contrast surfaces  |
| `--color-ocean`       | Ocean       | `#5F8190` | Secondary actions, active states, charts   |
| `--color-ocean-light` | Ocean Light | `#8AADB8` | Subtle highlights, selected areas, collapsed-sidebar avatar accent |
| `--color-ocean-dark`  | Ocean Dark  | `#2E4A5A` | Hover states, borders, secondary emphasis  |
| `--color-off-white`   | Off White   | `#F7F7F5` | Application background                     |
| `--color-white`       | White       | `#FFFFFF` | Cards, modals, input surfaces              |

---

## 3.3 Supporting Neutral Colours

| Token           |       Hex | Use                         |
| --------------- | --------: | --------------------------- |
| `--neutral-950` | `#111820` | High-contrast text          |
| `--neutral-800` | `#27323C` | Strong secondary text       |
| `--neutral-700` | `#3F4B55` | Standard secondary text     |
| `--neutral-600` | `#5C6872` | Muted text                  |
| `--neutral-500` | `#77838C` | Placeholder text            |
| `--neutral-400` | `#A4ADB4` | Disabled text               |
| `--neutral-300` | `#C8CFD4` | Strong borders              |
| `--neutral-200` | `#DCE1E4` | Standard borders            |
| `--neutral-100` | `#EDF0F2` | Subtle backgrounds          |
| `--neutral-50`  | `#F8F9F9` | Hover and inactive surfaces |

---

## 3.4 Semantic Colours

Semantic colours are allowed only where meaning would be unclear using the core HIMARK palette.

| Token       |       Hex | Use                                  |
| ----------- | --------: | ------------------------------------ |
| `--success` | `#3F6B5A` | Completed, successful                |
| `--warning` | `#9A7436` | Attention, nearing deadline          |
| `--danger`  | `#9A4E4E` | Errors, destructive actions, overdue |
| `--info`    | `#5F8190` | Informational states                 |

Rules:

- Use semantic colours sparingly.
- Never use semantic colours decoratively.
- Do not use bright red, green, orange, or purple in general charts.
- Status colour must always be paired with text or an icon.
- Never rely on colour alone to communicate meaning.

---

## 3.5 Application Colour Distribution

Recommended visual balance:

```text
Off White / White surfaces: 70–80%
Ink Deep / Midnight (sidebar + dark-theme surfaces): 10–15%
Ocean / Ocean Dark / Ocean Light accents: 3–6%
Semantic colours: under 2%
```

The application should remain predominantly white and off-white.

---

## 4. Design Tokens

## 4.1 CSS Variables

```css
:root {
  --color-midnight: #1c2b3a;
  --color-ink-deep: #0e1822;
  --color-ocean: #5f8190;
  --color-ocean-light: #8aadb8;
  --color-ocean-dark: #2e4a5a;
  --color-off-white: #f7f7f5;
  --color-white: #ffffff;

  --neutral-950: #111820;
  --neutral-800: #27323c;
  --neutral-700: #3f4b55;
  --neutral-600: #5c6872;
  --neutral-500: #77838c;
  --neutral-400: #a4adb4;
  --neutral-300: #c8cfd4;
  --neutral-200: #dce1e4;
  --neutral-100: #edf0f2;
  --neutral-50: #f8f9f9;

  --success: #3f6b5a;
  --warning: #9a7436;
  --danger: #9a4e4e;
  --info: #5f8190;

  --background-app: var(--color-off-white);
  --background-surface: var(--color-white);
  --background-sidebar: var(--color-ocean-light);
  --background-hover: var(--neutral-50);
  --background-selected: rgba(28, 43, 58, 0.09);

  --text-primary: var(--color-ink-deep);
  --text-secondary: var(--neutral-700);
  --text-muted: var(--neutral-600);
  --text-disabled: var(--neutral-400);
  --text-on-dark: var(--color-white);

  --border-subtle: var(--neutral-100);
  --border-default: var(--neutral-200);
  --border-strong: var(--neutral-300);

  --focus-ring: rgba(95, 129, 144, 0.35);
}
```

---

## 4.2 Spacing Scale

HIVE uses an 8-point spacing system.

| Token      |  Value |
| ---------- | -----: |
| `space-0`  |  `0px` |
| `space-1`  |  `4px` |
| `space-2`  |  `8px` |
| `space-3`  | `12px` |
| `space-4`  | `16px` |
| `space-5`  | `20px` |
| `space-6`  | `24px` |
| `space-8`  | `32px` |
| `space-10` | `40px` |
| `space-12` | `48px` |
| `space-16` | `64px` |
| `space-20` | `80px` |

Use `4px` increments only for fine internal alignment.

---

## 4.3 Border Radius

| Token         |    Value | Use                             |
| ------------- | -------: | ------------------------------- |
| `radius-sm`   |    `8px` | Inputs, chips, compact controls |
| `radius-md`   |   `12px` | Cards, dropdowns                |
| `radius-lg`   |   `16px` | Large cards, modals             |
| `radius-xl`   |   `20px` | Major sections                  |
| `radius-full` | `9999px` | Avatars, pills, toggles         |

---

## 4.4 Shadows

```css
--shadow-xs: 0 1px 2px rgba(14, 24, 34, 0.04);
--shadow-sm: 0 2px 8px rgba(14, 24, 34, 0.06);
--shadow-md: 0 8px 24px rgba(14, 24, 34, 0.08);
--shadow-lg: 0 16px 48px rgba(14, 24, 34, 0.12);
```

Use shadows sparingly.

---

## 4.5 Motion

| Token             | Duration | Use                           |
| ----------------- | -------: | ----------------------------- |
| `motion-fast`     |  `120ms` | Hover, focus, toggle          |
| `motion-standard` |  `180ms` | Menus, cards, selected states |
| `motion-slow`     |  `240ms` | Drawers, modals, transitions  |

Recommended easing:

```css
cubic-bezier(0.2, 0, 0, 1)
```

Avoid bouncy or decorative motion.

---

## 5. Typography

## 5.1 Font Family

Primary recommendation:

```text
Inter
```

Fallback:

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  sans-serif;
```

## 5.2 Type Scale

| Style      |   Size | Line Height | Weight | Use                     |
| ---------- | -----: | ----------: | -----: | ----------------------- |
| Display    | `36px` |      `44px` |    600 | Rare major headers      |
| H1         | `30px` |      `38px` |    600 | Page title              |
| H2         | `24px` |      `32px` |    600 | Section title           |
| H3         | `20px` |      `28px` |    600 | Card title              |
| H4         | `16px` |      `24px` |    600 | Subsection title        |
| Body Large | `16px` |      `26px` |    400 | Introductory text       |
| Body       | `14px` |      `22px` |    400 | Standard interface text |
| Body Small | `13px` |      `20px` |    400 | Secondary details       |
| Label      | `12px` |      `16px` |    600 | Inputs, table headings  |
| Caption    | `11px` |      `16px` |    500 | Timestamps, metadata    |

Rules:

- Use sentence case.
- Avoid all caps except short metadata labels.
- Limit weights to 400, 500, and 600.
- Do not use oversized marketing typography inside the app.

---

## 6. Layout System

## 6.1 Application Shell

Desktop layout:

```text
Sidebar
Main content
Optional right-side detail drawer
```

| Element                 |          Size |
| ----------------------- | ------------: |
| Sidebar width           |       `240px` |
| Collapsed sidebar       |        `72px` |
| Top bar height          |        `72px` |
| Main content max width  |      `1600px` |
| Page horizontal padding |        `32px` |
| Page vertical padding   |   `24px–32px` |
| Right drawer width      | `400px–480px` |

## 6.2 Sidebar

The sidebar is a **permanent dark panel**, regardless of the active canvas
theme (see §7 "Theming"). Its own shade adapts to stay visually separated
from its neighboring canvas:

```css
/* Light canvas */
background: #0e1822; /* Ink Deep */
/* Dark canvas */
background: #1c2b3a; /* Midnight */
```

Navigation:

```text
Overview
Projects
Board
My Tasks
Inbox
Calendar
Files
Settings
```

Rules:

- Selected item: soft tinted pill (`rgba(95, 129, 144, 0.22)`) with white text, not a full-bleed fill
- Hover item (unselected): `rgba(255, 255, 255, 0.05)` background
- Default item text: `#8aa0ac`
- Selected item text/icon: white
- User profile appears at the bottom; the collapsed-state avatar uses Ocean Light background with Ink Deep text as its one deliberate accent use

## 6.3 Top Bar

Contains:

- Breadcrumb or page context
- Global search
- Notifications
- User profile

Do not use greeting text such as `Good morning, Marcus`.

## 6.4 Responsive Breakpoints

| Name    |           Width |
| ------- | --------------: |
| Mobile  |       `< 640px` |
| Tablet  |  `640px–1023px` |
| Desktop | `1024px–1439px` |
| Wide    |      `≥ 1440px` |

Rules:

- Sidebar becomes a drawer below desktop.
- Kanban scrolls horizontally.
- Tables collapse into cards on mobile.
- Right drawers become full-screen sheets.
- Primary actions remain visible.

---

## 7. Core Components

## 7.1 Buttons

### Primary

```css
background: #1c2b3a;
color: #ffffff;
```

### Secondary

```css
background: #ffffff;
border: 1px solid #dce1e4;
color: #1c2b3a;
```

### Tertiary

```css
background: transparent;
color: #2e4a5a;
```

### Destructive

```css
background: #9a4e4e;
color: #ffffff;
```

| Size   | Height | Padding |
| ------ | -----: | ------: |
| Small  | `32px` |  `12px` |
| Medium | `40px` |  `16px` |
| Large  | `48px` |  `20px` |

Rules:

- One primary action per page section.
- Icon buttons require accessible labels.
- Loading buttons keep their width.

---

## 7.2 Inputs

Default height: `40px`

Large input: `48px`

Focus state:

```css
border-color: #5f8190;
box-shadow: 0 0 0 3px rgba(95, 129, 144, 0.2);
```

Rules:

- Labels appear above fields.
- Placeholder text never replaces labels.
- Validation appears directly below.
- Required fields are identified in text.

---

## 7.3 Cards

```css
background: #ffffff;
border: 1px solid #edf0f2;
border-radius: 12px;
box-shadow: 0 2px 8px rgba(14, 24, 34, 0.04);
```

Card types:

- Summary card
- Project card
- Task card
- Settings card
- Empty-state card
- Detail card

Different pages must use different interaction models. Do not reuse the same KPI-table-drawer layout everywhere.

---

## 7.4 Tables

Use tables only for structured comparison.

Rules:

- 48px minimum row height
- Clear row hover
- Sticky headers when useful
- Right-align numeric values
- Put actions in the final column
- Convert rows to cards on mobile

---

## 7.5 Kanban Board

The Board is a dedicated primary page.

Default columns:

```text
Backlog
To Do
In Progress
Review
Done
```

Task cards show:

- Title
- Project when viewing all projects
- Priority
- Assignee
- Due date
- Labels
- Optional attachment/comment count

Board interactions:

- Drag and drop
- Keyboard movement
- Horizontal scrolling
- Project filter
- Assignee filter
- Priority filter
- Search

Do not place large KPI cards above the board.

---

## 7.6 Task Detail Drawer

Desktop behaviour:

```text
Right-side drawer
```

Sections:

```text
Title
Description
Status
Priority
Assignee
Due date
Labels
Attachments
Comments
Activity
```

Rules:

- Support deep linking.
- Keep destructive actions in overflow.
- Autosave small changes where safe.

---

## 7.7 Status Badges

Task status:

| Status      | Treatment        |
| ----------- | ---------------- |
| Backlog     | Neutral          |
| To Do       | Ocean Light tint |
| In Progress | Ocean            |
| Review      | Ocean Dark       |
| Done        | Success          |

Project status:

| Status      | Treatment |
| ----------- | --------- |
| Not Started | Neutral   |
| Active      | Ocean     |
| On Hold     | Warning   |
| Completed   | Success   |
| Archived    | Muted     |

---

## 7.8 Avatars

| Size |  Value |
| ---- | -----: |
| XS   | `24px` |
| SM   | `32px` |
| MD   | `40px` |
| LG   | `56px` |
| XL   | `80px` |

Use initials when no image exists.

---

## 7.9 Modals and Drawers

Use modals for:

- Creating projects
- Inviting team members
- Destructive confirmation
- Creating templates
- Complex file uploads

Use drawers for:

- Task detail
- Project detail
- File detail
- Contextual editing

| Modal  |   Width |
| ------ | ------: |
| Small  | `400px` |
| Medium | `560px` |
| Large  | `720px` |

---

## 7.10 Empty States

Every empty state must explain:

1. What is missing
2. Why it matters
3. What to do next

Example:

```text
No projects yet

Create your first project to begin organising work in HIVE.

[New Project]
```

---

## 7.11 Loading States

Use:

- Skeletons
- Button spinners
- Upload progress
- Optimistic task movement

Avoid full-screen loading after the initial app load.

---

## 7.12 Toasts

Examples:

```text
Task moved to Review.
Project created.
File uploaded.
Unable to save changes.
```

Rules:

- Keep messages brief.
- Offer Undo where appropriate.
- Show no more than three at once.

---

## 8. Page Patterns

## 8.1 Overview

Purpose:

```text
Understand what needs attention.
```

Includes:

- Active projects
- Tasks due today
- Overdue tasks
- Upcoming deadlines
- Recent activity
- Quick actions

Excludes:

- Kanban board
- Money
- CRM data
- Complex analytics

## 8.2 Projects

Structure:

```text
Page header
Search and filters
Project directory
Pagination or load more
```

## 8.3 Board

Structure:

```text
Page header
Project filter
Search
Assignee and priority filters
Kanban board
```

The board should consume most of the viewport.

## 8.4 My Tasks

Purpose:

```text
Show the current user's workload.
```

Groups:

- Due today
- Overdue
- Upcoming
- Completed

Use a focused list, not another dashboard.

## 8.5 Calendar

Structure:

```text
Calendar controls
Month / Week / Day switch
Calendar grid
Optional agenda panel
```

## 8.6 Files

Structure:

```text
Breadcrumb
Search
Folder navigation
File list or grid
File detail panel
```

## 8.7 Settings

Settings navigation:

```text
My Profile
Account
Workspace
Team
Notifications
Task Preferences
Project Templates
Integrations
```

Account sub-navigation:

```text
Account Information
Email & Password
Security
Sessions
Connected Devices
Deactivate Account
```

There is no Billing page.

---

## 9. Forms

Form structure:

```text
Section title
Supporting description
Fields
Validation
Primary action
```

Rules:

- Group related fields.
- Validate on blur and submit.
- Preserve unsaved data where practical.
- Use confirmation dialogs for destructive actions.
- Do not show validation errors before interaction.

---

## 10. Icons

Recommended library:

```text
Lucide
```

Rules:

- Use one icon library.
- Standard size: `18px–20px`
- Compact size: `16px`
- Large empty-state size: `32px–40px`
- Use 1.5px–2px stroke weight
- Icons support labels; they do not replace unfamiliar labels

---

## 11. Data Visualisation

HIVE is not a BI product.

Allowed charts:

- Project progress trend
- Task completion trend
- Workload distribution

Chart palette:

```text
#1C2B3A
#2E4A5A
#5F8190
#8AADB8
#D9E4E8
#EEF3F5
```

Rules:

- No rainbow charts.
- No 3D charts.
- No money-related charts.
- Prefer bars and lines over pie charts.

---

## 12. Content Style

Copy should be:

- Direct
- Brief
- Human
- Action-oriented

Preferred:

```text
Create project
Move to Review
Upload file
Invite member
No tasks due today
```

Avoid inflated or robotic language.

---

## 13. Accessibility

Target:

```text
WCAG 2.1 AA
```

Requirements:

- 4.5:1 minimum contrast for normal text
- Visible focus
- Logical tab order
- Keyboard-operable board
- Screen-reader announcements for task movement
- Reduced-motion support
- 44px touch targets where practical

---

## 14. Dark Mode

Dark mode is not required for the MVP.

If added later, it must be designed and tested separately rather than created through mechanical colour inversion.

---

## 15. Component Naming

React components:

```text
PascalCase
```

Component files:

```text
kebab-case
```

Examples:

```text
ProjectCard
TaskDetailDrawer
BoardColumn
project-card.tsx
task-detail-drawer.tsx
board-column.tsx
```

Variants:

```text
primary
secondary
tertiary
destructive
ghost
```

Sizes:

```text
sm
md
lg
```

---

## 16. Component Documentation

Every reusable component should define:

- Purpose
- Props
- Variants
- States
- Behaviour
- Accessibility
- Usage examples
- Do and don't guidance

---

## 17. Quality Checklist

Before approving a screen, confirm:

- The page has one clear purpose.
- The primary action is obvious.
- The interface is predominantly white or off-white.
- The sidebar uses Ocean Light.
- HIMARK colours are used consistently.
- No money-related content appears.
- No CRM language appears.
- No unnecessary charts appear.
- The page does not blindly copy another page layout.
- Empty, loading, error, and disabled states exist.
- Keyboard focus is visible.
- Responsive behaviour is defined.
- Destructive actions require confirmation.

---

## 18. Anti-Patterns

Do not:

- Use the same dashboard structure on every page
- Add KPI cards to every page
- Use random chart colours
- Use money or revenue metrics
- Treat HIVE as a CRM
- Add billing or subscriptions
- Add unnecessary client-facing features
- Overuse glassmorphism or gradients
- Hide primary actions in menus
- Add features solely because competitors have them

---

## 19. Product-Specific Rules

1. HIVE is an internal HIMARK tool.
2. HIVE is not sold externally.
3. HIVE is a project management tool only.
4. The Board has its own dedicated page.
5. The Overview must not contain a Kanban board.
6. The app must remain simple and direct.
7. Projects, tasks, calendar, files, and settings are the core product.
8. Every feature must justify its complexity.
9. Workflows must reflect how HIMARK actually operates.
10. Simplicity takes priority over feature count.

---

## 20. Source of Truth

This design system is the source of truth for HIVE's visual language and interaction behaviour.

If a proposed screen conflicts with this document:

1. Reuse an existing pattern where possible.
2. Document the reason for any exception.
3. Update the design system before introducing a new reusable pattern.
4. Avoid one-off styling.

HIVE should feel like one coherent product, not a collection of unrelated dashboards.

---

## 21. Editorial Pass (2026-08-04)

Per an explicit request to elevate HIVE's visual execution toward something
more editorial and premium, the following documented exceptions apply. The
HIMARK colour palette (§3.2), spacing scale (§4.2), and sidebar colour (§6.2)
are unchanged -- this pass is about typographic craft and structure, not a
rebrand.

**Typography.** A third face joins Inter/Geist:

- **Body & UI** — Geist (the codebase's actual loaded font; §5.1's "Inter"
  recommendation predates this and was never wired up — `--font-family-base`
  pointed at a font that was never loaded, silently falling back to the OS
  default the whole time. Fixed as part of this pass.)
- **Display** — Newsreader, serif, used only for `h1` (page titles) and the
  rare `.font-display` utility (design-system.md's own "Display" row, §5.2).
  Never for body copy, card titles, or dense UI chrome.
- **Data** — Geist Mono, applied via a new `.font-data` utility with tabular
  figures, to every instrument value in the product: project codes
  (`PRJ-0001`), WIP counts (`2/2`), percentages, and dates. This is additive,
  not a §5.2 conflict — the type scale's sizes/weights are unchanged, this is
  a font-family override for numeric/coded values specifically.

`h1` shifts from 30/38/600 to 32/40/500 and gains the serif family — still
well inside "Page title," not the oversized marketing type §5.2 warns
against.

**Radius.** §4.3's 8/12/16/20 scale tightens to 6/8/10/14. Sharper corners
read more institutional and less generic-SaaS-bubbly, in service of the
editorial direction. `--radius-full` (pills, avatars) is unchanged.

**New token:** `--rule`, aliased to `--border-default`. Names the hairline
divider explicitly as a structuring device (sidebar nav rows, list rows,
section separators) rather than an incidental border colour, and is now the
primary way sections separate — shadow is reserved for true overlays
(dialogs, dropdown menus, drag ghosts), not resting surfaces like cards.
`--shadow-sm`/`--shadow-md` were nudged fainter to reflect this.

**Sidebar selected state (§6.2 exception).** The filled Midnight pill reads
as the most generic-SaaS element in the shell. Replaced with a quieter
table-of-contents marker: a 3px Midnight rule on the leading edge, Midnight
(not white) text/icon at weight 600, and a faint white wash instead of a
solid fill. Contrast against Ocean Light is preserved (Midnight text/icon
on Ocean Light meets the same 4.5:1 floor as Ink Deep did); only the
_shape_ of the selection changed, not its legibility.
