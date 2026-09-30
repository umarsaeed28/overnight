# vibe-check: Components

Almost nothing is boxed. `.nm` is a white card with a hairline; `.nm-sm` is the same without lift; `.nm-inset` is a light grey field; `.nm-key` is the ink key. Five barely-there tints exist (`.nm-sky`, `.nm-mint`, `.nm-butter`, `.nm-lilac`, `.nm-coral`). Set the radius with `--r`.

## 1. BUTTONS

### Variants

| Variant | Background | Text | Border | Radius | Height |
|---------|-----------|------|--------|--------|--------|
| Primary | `{neutral.800}` (ink) | `{neutral.50}` | none | 14px | 56px |
| Secondary | white | `--text1` | 1px solid `--border-visible` | 14px | 48px |
| Ghost | transparent | `--accent` text, underlined | none | 12px | 44px |
| Destructive | white | `--error` | 1px solid `--border-visible` | 14px | 48px |

### Specs

| Property | Value |
|----------|-------|
| Height (large) | 56px |
| Height (small) | 40px |
| Padding (large) | 0 36px |
| Padding (small) | 0 20px |
| Font | `Bricolage Grotesque` 500, 18px (14px small) |
| Min touch target | 44px |

### States

| State | Change |
|-------|--------|
| **Hover** | Lifts 1px |
| **Active / Pressed** | Returns to 0, scale 0.99 |
| **Disabled** | Opacity 0.4, no lift |
| **Focus** | 4px ring in `--focus`, 3px offset |

---

## 2. CARDS / SURFACES

### Standard Card
- Background: `--surface1` (white)
- Border: 1px solid `--border`
- Radius: 24px
- Padding: 32px mobile, 48px desktop
- Shadow: level 2

### Featured Card
- There is no featured card; both pricing cards are equal. A plan is marked by an "Early access" LED, not by color.
- Radius: 24px
- Shadow: level 2

### Compact Card
- `.nm-sm`, radius 16px, padding 16px, used inside the phone

### Content Layout
- Title: `--subheading`, `--text1`
- Description: `--body-sm`, `--text2`
- Metadata: `--caption`, `--text3`
- Internal spacing between elements: `--space-sm`
- Press state: only when the card is a link

---

## 3. INPUTS

### Text Field

| Property | Value |
|----------|-------|
| Height | 56px inside a grey field with 8px padding |
| Background | `--surface2` |
| Border (default) | 1px solid `--border-visible` |
| Border (focus) | same, plus a 4px focus ring, 3px offset |
| Border (error) | unchanged; a pill with a rose LED and the message sits below |
| Radius | 20px field, 12px inner |
| Padding | 0 16px |
| Font | `Bricolage Grotesque`, 20px, weight 400 |
| Placeholder color | `--text2` |

### Label
- Position: above field, 8px gap (visually hidden when a heading gives context, but always present for screen readers)
- Font: `Bricolage Grotesque`, `--body-sm`, `--text2`

### States

| State | Treatment |
|-------|-----------|
| **Default** | Grey field, 1px edge, ink key seated inside |
| **Focus** | 4px ring |
| **Error** | A small grey pill with a rose LED and the message, saying what to fix |
| **Disabled** | Opacity 0.4 |

### Multiline
- Same field, radius 20px, min-height 140px, auto-grows

---

## 4. LISTS / DATA ROWS

### Standard Row (agents, steps, trust)

| Property | Value |
|----------|-------|
| Min height | 80px |
| Padding | 24px 0 |
| Divider | 1px `--border`, between rows |
| Label font | `Bricolage Grotesque`, 20px, 400, `--text1` |
| Value font | `--body`, 300, `--text2` |
| Accessory | the number in accent text, weight 300 |

### Interaction States

| State | Treatment |
|-------|-----------|
| **Default** | Plain |
| **Pressed** | `--surface2` |
| **Selected** | `--accent-subtle` |

### Data Row (Label + Value)
- Left: label in `--text2`
- Right: value in `--text1`
- Unit/suffix: `--caption`, `--text3`

---

## 5. NAVIGATION / TAB BAR

The landing page has no nav bar: the wordmark sits top left and a skip link is the only nav control. If a nav is needed:

### Tab Bar

| Property | Value |
|----------|-------|
| Height | 56px |
| Background | transparent |
| Border | 1px `--border` bottom |
| Font | `Bricolage Grotesque`, `--body-sm`, 400 |

### Tab States

| State | Treatment |
|-------|-----------|
| **Active** | `--text1` with a 1px ink underline |
| **Inactive** | `--text2` |
| **Hover** | `--text1` |

### Navigation Bar
- Title: `--heading`, `--text1`
- Back button: a text link with an arrow
- Background: transparent

---

## 6. TAGS / CHIPS

| Property | Value |
|----------|-------|
| Height | 32px |
| Padding | 4px 12px |
| Radius | 999px |
| Font | `Bricolage Grotesque`, `--caption`, 400 |
| Background | transparent, with a breathing LED before the text |
| Text color | `--text2` |
| Border | none |

### Selected State
- Background: `--surface2`
- Text: `--text1`
- Border: none

### Status Variants
Use status colors for semantic tags: `--success-bg` + `--success`, `--warning-bg` + `--warning`, `--error-bg` + `--error`. The "Early access" pill is an LED and two words.

---

## 7. OVERLAYS

### Modal / Dialog

| Property | Value |
|----------|-------|
| Background | white |
| Radius | 24px |
| Shadow | level 2 |
| Backdrop | ink at 30% |
| Max width | 560px |
| Padding | 40px |
| Close button | a text link, "Close", top right |

### Bottom Sheet

| Property | Value |
|----------|-------|
| Background | white |
| Top radius | 24px |
| Handle | 40px by 4px grey pill |
| Backdrop | ink at 30% |
| Dismiss | drag-to-dismiss |

### Dropdown / Popover

| Property | Value |
|----------|-------|
| Background | white |
| Radius | 16px |
| Shadow | level 2 |
| Border | 1px solid `--border` |
| Item height | 44px |
| Selected indicator | an accent LED |

---

## 8. STATE PATTERNS

### Empty State
- Layout: left-aligned, generous top padding (128px+)
- Icon/Illustration: one thin tile outline
- Headline: `--subheading`, `--text1`
- Description: `--body`, `--text2`, max 2 lines
- CTA: the ink key, 24px below description

### Loading
- Inline: an LED breathing next to the words "Checking"; still under reduced motion
- Full screen: the tile stack with the beam looping
- Content appearance: fade in over 200ms

### Error
- Inline (field): a grey pill with a rose LED, `--text1`
- Screen-level: a white card with one rose-ringed tile, a title, the cause and what to do next
- Tone: plain and specific. Never apologize, never blame the user.

### Disabled
- Opacity 0.4, no interaction, maintains layout
- Shadow unchanged
- No hover/focus states

---

## 9. ALERT / BANNER (the bug panel)

### Specs

| Property | Value |
|----------|-------|
| Radius | 16px |
| Padding | 16px |
| Icon size | 10px LED |
| Icon gap | 8px |
| Font (title) | `Bricolage Grotesque`, 18px, 500, ink |
| Font (description) | `--body`, 300, ink |
| Dismiss button | a text link |
| Layout | rose LED and title, body, then Where and Try this rows, in a small white card |

### Semantic Variants

| Variant | Background | Border | Icon color | Text color |
|---------|-----------|--------|-----------|------------|
| Info | white | 1px `--border` | accent LED | `--text1` |
| Success | white | 1px `--border` | sage LED | `--text1` |
| Warning | white | 1px `--border` | amber LED | `--text1` |
| Error | white | 1px `--border` | rose LED | `--text1` |

---

## 10. ACCORDION

### Specs

| Property | Value |
|----------|-------|
| Header height | 72px |
| Header padding | 24px 0 |
| Header font | `Bricolage Grotesque`, 24px, 400, `--text1` |
| Chevron | a plain plus that rotates 45 degrees |
| Content padding | 0 0 32px |
| Content font | `--body`, 300, `--text2`, max 62ch |
| Divider | 1px `--border` |
| Background | none |

### States

| State | Treatment |
|-------|-----------|
| **Closed** | Plus, content hidden |
| **Open** | Plus rotated into a cross, content visible |
| **Hover** | Cursor is a pointer |
| **Disabled** | Opacity 0.4 |
| **Focus** | 4px ring, 3px offset |

---

## 11. THE 3D PIECES

### Tile stack (`.scene` > `.stack` > `.layer`)
- Five tiles, barely tinted (13%), hairline edge, radius 22px, a soft ground shadow, grey bars and an ink key. Perspective 1700px; `rotateX(57deg) rotateZ(-36deg)`; each tile at `translateZ(n × gap × (0.5 + explode × 1.5))`.
- The bug tile gets a 2px rose ring and glow as the scan plane reaches it.
- Registered properties: `--explode`, `--scan`, `--tests`, `--cam`, `--turn`, `--lift`.

### Scan plane
- A thin sheet of periwinkle light: 12% to 3% fill, 1.5px border, a faint glow. The only glow on the page.

### Story (`.story`)
- A 340vh track between two hairlines. A sticky 100svh stage; scroll drives explode, tests, scan and camera, and cross-fades three steps. A 1px ink progress line. Fallback: normal flow with a static scene.

### Phone (`.phone`)
- A white object with a hairline, radius 48px, two darker plates behind it (6px and 12px) for thickness, and a grey screen. Swings in on scroll; tilts toward the pointer.

### Agent relay (`.agents-scene` > `.flow`)
- A white floor slab with a hairline, four barely-tinted stations that lift from 0.7rem to 2rem as work arrives, a dashed track and return loop, and two small glowing packets: rose for a real bug, sage for an out-of-date test. Upright name pills face the camera. Reduced motion: still.

### LED (`.led`)
- A 10px lit dot with a soft ring that breathes over 3.2s. The only ornament.
