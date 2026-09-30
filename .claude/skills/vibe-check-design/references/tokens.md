# vibe-check: Tokens

Source of truth in code: `packages/ui/src/tokens.css`. Values below match it.

## 0. PRIMITIVES

### Pale tints (14 to 18% into white; never a block of color)

| Name | Hex | Job |
|------|-----|-----|
| sky | `#A9C4E8` | First agent, first tile |
| mint | `#A9D3C2` | Second agent, pass LED |
| butter | `#E6D6AA` | Third agent |
| rose | `#E2B5B0` | The bug tile only |
| lilac | `#C5BEE3` | Fourth agent |

### Neutral (cool grey, barely tinted)

| Step | Hex | Use |
|------|-----|-----|
| 50 | `#FFFFFF` | Page and cards |
| 100 | `#F5F6F9` | Fields, code, recesses |
| 200 | `#E9EBF1` | Hairlines |
| 300 | `#CDD1DC` | Strong hairline |
| 400 | `#9AA0B2` | Disabled |
| 500 | `#5A6072` | Secondary text |
| 600 | `#434859` | Strong secondary |
| 700 | `#2E3342` | Deep |
| 800 | `#171B26` | Ink and the solid key |
| 900 | `#0F1116` | Dark page |
| 950 | `#171A22` | Dark recess |

### Brand (soft periwinkle, used for small marks only)

| Step | Hex |
|------|-----|
| 50 | `#F3F5FC` |
| 100 | `#E4E9F8` |
| 200 | `#CBD5F0` |
| 300 | `#ACBBE8` |
| 400 | `#7B8FD8` (marks, beam, LEDs) |
| 500 | `#8FA6D8` (dark-mode mark) |
| 600 | `#6478C4` |
| 700 | `#4A5BB5` (accent text) |
| 800 | `#36448A` |
| 900 | `#252E5E` |
| 950 | `#171C3A` |

### Status

| Color | 50 (bg tint) | 500 (foreground) | 900 (dark tint) |
|-------|-------------|-----------------|-----------------|
| Red (bug, muted rose) | `#F8EEEC` | `#9A4A43` | `#3A2220` |
| Green (pass, muted sage) | `#E6F2EC` | `#2A7357` | `#183A2D` |
| Amber | `#F6F0DE` | `#7A5A00` | `#3D2C00` |

Dark-mode foregrounds: accent text `#A9BDEB`, bug text `#E4A39C`, pass `#8CCFB2`.

### Spacing and radii primitives

Spacing: `0, 2, 4, 8, 16, 24, 32, 48, 64, 96, 128`. Radii: `0, 12, 16, 20, 24, 32, 999`.

---

## 1. TYPOGRAPHY

| Role | Font | Fallback | Weight | Use |
|------|------|----------|--------|-----|
| **Display** | `"Bricolage Grotesque"` | `ui-sans-serif, system-ui, sans-serif` | 380 | Headings, wordmark, prices |
| **Body / UI** | `"Bricolage Grotesque"` | `ui-sans-serif, system-ui, sans-serif` | 300, 400, 500 | Everything else |
| **Mono / Code** | `"Geist Mono"` | `ui-monospace, "SF Mono", Menlo, monospace` | 400 | `.feature` sample and prompts |

One family does display and body. Nothing is heavier than 500. `mono_for_code: true`, `mono_for_metrics: false`: prices stay in the display face.

### Type Scale

| Token | Size | Line Height | Letter Spacing | Weight | Use |
|-------|------|-------------|----------------|--------|-----|
| `--display` | clamp(42px, 6.6vw, 92px) | 1.02 | -0.035em | 380 | Hero headline |
| `--heading` | clamp(36px, 4.4vw, 60px) | 1.02 | -0.035em | 380 | Section headings |
| `--subheading` | 20px to 30px | 1.15 | -0.02em | 400 | Card and step titles |
| `--body` | 20px | 1.6 | 0 | 300 | Body and support copy |
| `--body-sm` | 18px | 1.6 | 0 | 300 | Secondary text |
| `--caption` | 14px | 1.5 | 0 | 400 | Notes |
| `--label` | 14px | 1.4 | 0 | 500 | Pills, keys |

### Typographic Rules

- Headings balance their lines (`text-wrap: balance`); body uses `pretty`.
- Display steps down below 700px (hero floor 2.6rem).
- Body measure 38 to 62ch. Sentence case; no all caps. Never accent a single word.

---

## 2. COLOR SYSTEM (Semantic Tokens)

### Primary Mode (light)

| Token | Primitive | Hex | Role |
|-------|-----------|-----|------|
| `--background` | `{neutral.50}` | `#FFFFFF` | Page |
| `--bg` | none | `var(--background)` | Alias |
| `--surface1` | `{neutral.50}` | `#FFFFFF` | Cards |
| `--surface2` | `{neutral.100}` | `#F5F6F9` | Fields, code, recesses |
| `--surface3` | `{neutral.200}` | `#E9EBF1` | Strong inset |
| `--border` | none | `#E9EBF1` (ink at 9%) | Hairline |
| `--border-visible` | none | `#7C8294` | Input edge (1px) |
| `--text1` | `{neutral.800}` | `#171B26` | Text |
| `--text2` | `{neutral.500}` | `#5A6072` | Secondary text |
| `--text3` | `{neutral.500}` | `#5A6072` | Tertiary text |
| `--text4` | `{neutral.400}` | `#9AA0B2` | Disabled |
| `--accent` | `{brand.400}` | `#7B8FD8` | Marks, beam, LEDs |
| `--accent-subtle` | `{brand.50}` | `#F3F5FC` | Tinted background |
| `--success` | `{green.500}` | `#2A7357` | Pass |
| `--warning` | `{amber.500}` | `#7A5A00` | Caution |
| `--error` | `{red.500}` | `#9A4A43` | Bug |

### Secondary Mode (dark)

| Token | Primitive | Hex | Role |
|-------|-----------|-----|------|
| `--background` | `{neutral.900}` | `#0F1116` | Page |
| `--bg` | none | `var(--background)` | Alias |
| `--surface1` | `{neutral.900}` | `#0F1116` | Cards |
| `--surface2` | `{neutral.950}` | `#171A22` | Fields, code |
| `--surface3` | none | `#20242E` | Strong inset |
| `--border` | none | `#23262F` | Hairline |
| `--border-visible` | none | `#7F869A` | Input edge |
| `--text1` | none | `#EEF0F6` | Text |
| `--text2` | none | `#A0A6B8` | Secondary |
| `--text3` | none | `#A0A6B8` | Tertiary |
| `--text4` | none | `#6E7488` | Disabled |
| `--accent` | `{brand.500}` | `#8FA6D8` | Marks |
| `--accent-subtle` | `{brand.950}` | `#171C3A` | Tinted background |
| `--success` | `{green.500}` | `#8CCFB2` | Pass |
| `--warning` | `{amber.500}` | `#FFD86B` | Caution |
| `--error` | `{red.500}` | `#E4A39C` | Bug |

### Accent & Status Tints

| Token | Primary | Secondary | Usage |
|-------|---------|-----------|-------|
| `--accent-subtle` | `#F3F5FC` | `#171C3A` | Tinted backgrounds |
| `--success-bg` | `#E6F2EC` | `#183A2D` | Pass panels |
| `--warning-bg` | `#F6F0DE` | `#3D2C00` | Caution panels |
| `--error-bg` | `#F8EEEC` | `#3A2220` | Bug panels |

### Color Usage Rules

- Measured: ink on white 17.2:1, secondary 6.3:1 (5.8:1 on the grey field), accent text 6.1:1, bug text 6.1:1, pass 5.7:1, input edge 3.8:1; dark ink 16.6:1, secondary 7.8:1, edge 5.2:1.
- The solid key is ink on the page color, and inverts automatically in dark mode.

---

## 3. SPACING

### Scale (8px base)

| Token | Value | Use |
|-------|-------|-----|
| `--space-2xs` | 2px | Optical nudges |
| `--space-xs` | 4px | Icon gaps |
| `--space-sm` | 8px | Tight groups |
| `--space-md` | 16px | Component padding |
| `--space-lg` | 24px | Card padding |
| `--space-xl` | 32px | Group separation |
| `--space-2xl` | 48px | Inner section gaps |
| `--space-3xl` | 64px | Section padding (mobile 128) |
| `--space-4xl` | 96px | Section padding (desktop up to 224) |

White space is the main structure: sections are separated by 8 to 14rem.

---

## 4. BORDERS & RADII

| Token | Value | Primitive | Use |
|-------|-------|-----------|-----|
| `--radius-element` | 16px | `{radii[2]}` | Small tiles |
| `--radius-control` | 14px | `{radii[1]}` | Buttons, inputs |
| `--radius-component` | 20px | `{radii[3]}` | Code, fields |
| `--radius-container` | 24px | `{radii[4]}` | Cards, pricing |
| `--radius-pill` | 999px | `{radii[6]}` | Pills, LEDs |

| Element | Border |
|---------|--------|
| Cards | 1px solid `--border` |
| Buttons | none |
| Inputs | 1px solid `--border-visible` |
| Tags / Chips | none |
| Modals / Sheets | 1px solid `--border` |

---

## 5. ELEVATION & SHADOWS

Strategy: flat.

| Level | Light Mode | Dark Mode | Use |
|-------|-----------|----------|-----|
| **0** | None | None | Text, rows, FAQ |
| **1** | `0 1px 2px` ink at 4% | `0 1px 2px` black at 40% | Small cards (`.nm-sm`) |
| **2** | level 1 plus `0 18px 40px -22px` ink at 10% | level 1 plus black at 50% | Cards (`.nm`) |
| **3** | `0 10px 24px -14px` ink at 50% | same | The solid key |

---

## 6. MOTION & INTERACTION

### Personality

Smooth and quiet. One idea in motion: the scan beam. Everything else enters softly or waits for the pointer.

### Timing

| Type | Duration | Easing | Use |
|------|----------|--------|-----|
| **Micro** | 200ms | ease-out | Shadow changes |
| **Standard** | 220ms | `cubic-bezier(0.22, 1, 0.36, 1)` | Key hover, tilt, plus rotate |
| **Emphasis** | 3.2s LED, 9s hero beam, 14s relay | ease-in-out / linear | Ambient loops |

### Interaction States

Hover lifts 1px; active returns to 0 at 0.99 scale. Focus is a 4px ring (`#4A5BB5`, `#B9C0FF` in dark) with a 3px offset. Reduced motion or no scroll timelines: no loops, no fade-up, no pinned track.

---

## 7. ICONOGRAPHY

> **Fallback disclosure.** The tick, cross and plus are Vibe Check's own shapes. For any glyph the brand has not drawn, Phosphor light is a stand-in and is not the brand's own icon set.

### Observed style

| Attribute | Value |
|-----------|-------|
| Description | One tick, cross and plus at 3.2 stroke with round caps, in ink or accent text; LEDs as small lit dots |
| Stroke weight | regular |
| Corner treatment | fully-round |
| Fill style | outline |
| Form language | geometric |
| Visual density | minimal |

### Fallback kit

- **Kit:** Phosphor
- **Weight / variant:** light
- **Match score:** medium
- **Why this kit:** a thin, even stroke with round caps suits light type on white.
- **CDN:** `https://unpkg.com/@phosphor-icons/web@2/src/light/style.css` (reference only; in this repo prefer inline SVG, since no third-party origins are allowed)
- **Usage:** `<i class="ph-light ph-check"></i>`

### Sizes

| Context | Size |
|---------|------|
| Inline with body text | 20px |
| Feature marks | 24px |
| Keys | 20px |

### Color rule

Icons use `currentColor`: ink on keys, accent text for marks, pass green for passes.

### Don't

- Never use emoji as icons.
- Never claim these are the brand's real icons if they came from the fallback kit.
