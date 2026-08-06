
# HIVE Color Palette

## Purpose

This document defines the official colour system for **HIVE**, HIMARK's internal project management platform.

The palette is intentionally restrained. HIVE should feel calm, professional and execution-focused.

---

# 1. Brand Palette

| Token | Name | Hex | Usage |
|---|---|---|---|
| `--color-midnight` | Midnight | `#1C2B3A` | Primary buttons, active navigation, headings |
| `--color-ink-deep` | Ink Deep | `#0E1822` | Primary text |
| `--color-ocean` | Ocean | `#5F8190` | Secondary actions, links, charts |
| `--color-ocean-light` | Ocean Light | `#8AADB8` | Subtle highlights, selected-area accents |
| `--color-ocean-dark` | Ocean Dark | `#2E4A5A` | Hover states, emphasis |
| `--color-off-white` | Off White | `#F7F7F5` | App background |
| `--color-white` | White | `#FFFFFF` | Cards, dialogs, forms |

---

# 2. Neutrals

| Token | Hex |
|---|---|
| `--neutral-950` | `#111820` |
| `--neutral-800` | `#27323C` |
| `--neutral-700` | `#3F4B55` |
| `--neutral-600` | `#5C6872` |
| `--neutral-500` | `#77838C` |
| `--neutral-400` | `#A4ADB4` |
| `--neutral-300` | `#C8CFD4` |
| `--neutral-200` | `#DCE1E4` |
| `--neutral-100` | `#EDF0F2` |
| `--neutral-50` | `#F8F9F9` |

---

# 3. Semantic Colours

| Meaning | Token | Hex |
|---|---|---|
| Success | `--success` | `#3F6B5A` |
| Warning | `--warning` | `#9A7436` |
| Error | `--danger` | `#9A4E4E` |
| Information | `--info` | `#5F8190` |

Semantic colours are reserved for status and feedback—not branding.

---

# 4. Colour Distribution

Recommended balance:

- Off White / White: **70–80%**
- Ink Deep / Midnight (sidebar + dark-theme surfaces): **10–15%**
- Ocean / Ocean Dark / Ocean Light accents: **3–6%**
- Semantic colours: **<2%**

---

# 5. UI Mapping

| UI Element | Colour |
|---|---|
| Application background | Off White |
| Cards | White |
| Sidebar | Ink Deep (light canvas) / Midnight (dark canvas) |
| Selected navigation | Midnight |
| Primary button | Midnight |
| Primary button text | White |
| Secondary button | White |
| Secondary button border | Neutral 200 |
| Headings | Ink Deep |
| Body text | Ink Deep |
| Secondary text | Neutral 700 |
| Muted text | Neutral 600 |
| Dividers | Neutral 200 |
| Hover background | Neutral 50 |
| Focus ring | Ocean |

---

# 6. Kanban Colours

| Element | Colour |
|---|---|
| Board background | Off White |
| Column background | White |
| Task card | White |
| Column title | Ink Deep |
| Drag overlay | White + medium shadow |
| Selected task | Midnight outline |
| Drop target | Ocean Light tint |

---

# 7. Charts

Approved palette only:

1. `#1C2B3A`
2. `#2E4A5A`
3. `#5F8190`
4. `#8AADB8`
5. `#D9E4E8`
6. `#EEF3F5`

Do not use rainbow palettes or unrelated colours.

---

# 8. CSS Tokens

```css
:root {
  --color-midnight: #1C2B3A;
  --color-ink-deep: #0E1822;
  --color-ocean: #5F8190;
  --color-ocean-light: #8AADB8;
  --color-ocean-dark: #2E4A5A;
  --color-off-white: #F7F7F5;
  --color-white: #FFFFFF;

  --neutral-950: #111820;
  --neutral-800: #27323C;
  --neutral-700: #3F4B55;
  --neutral-600: #5C6872;
  --neutral-500: #77838C;
  --neutral-400: #A4ADB4;
  --neutral-300: #C8CFD4;
  --neutral-200: #DCE1E4;
  --neutral-100: #EDF0F2;
  --neutral-50: #F8F9F9;

  --success: #3F6B5A;
  --warning: #9A7436;
  --danger: #9A4E4E;
  --info: #5F8190;
}
```

---

# 9. Accessibility

- Normal text: minimum 4.5:1 contrast.
- Large text/UI boundaries: minimum 3:1.
- Never communicate meaning using colour alone.
- Pair semantic colours with labels or icons.

---

# 10. Anti-Patterns

Do not:

- Introduce random accent colours.
- Use gradients as primary branding.
- Use bright reds, greens or purples for decoration.
- Add money-themed colours.
- Change the sidebar away from Ocean Light.
- Create page-specific colour systems.

---

# 11. Source of Truth

This document is the definitive colour reference for HIVE.

Every screen, component and chart must use these tokens. Any new colour requires updating this document before implementation.
