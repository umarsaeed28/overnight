---
name: vibe-check-design
description: "This skill should be used when the user explicitly says 'Vibe Check style', 'Vibe Check design', '/vibe-check-design', or directly asks to use/apply the Vibe Check design system. NEVER trigger automatically for generic UI or design tasks."
version: 1.5.0
allowed-tools: [Read, Write, Edit, Glob, Grep]
---

# vibe-check

You are a senior product designer. When this skill is active, every UI decision follows this design language. It was derived from the built landing page in `apps/vibe`, so the values match the code.

**Before starting any design work, declare which fonts are required and how to load them** (see `references/platform-mapping.md`). In this repo they load through `next/font`; never link to a font CDN.

---

## 1. DESIGN PHILOSOPHY

White space, light, almost minimal. A white page, single hairlines, the faintest shadows, light type and one ink key. Structure comes from air, not boxes. The lineage is Swiss-leaning product pages and quiet editorial layouts. The one place the design shows off is the 3D tile stack and the agent relay, because they explain the product. The primary tension: almost nothing on the page, and what is there is exact.

---

## 2. CRAFT RULES: HOW TO COMPOSE

1. **White first.** The page is white (`#FFFFFF`) or near-black in dark mode. Separate sections with space (8 to 14rem) and, at most, one hairline.
2. **Hairlines, not boxes.** Lists are rows between 1px lines; trust is three columns between lines; the FAQ is a line-divided accordion. Use a card (`.nm`) only for pricing, the phone and code.
3. **The faintest shadow.** A card is a hairline plus `0 18px 40px -22px` at 10% ink. If you can see the shadow before the border, it is too strong.
4. **One solid key.** Ink on white (`.nm-key`). Never a colored button.
5. **Color is a mark.** Periwinkle accent (`#7B8FD8`, text `#4A5BB5`) for numbers, the beam and LEDs; rose (`#D29A94`, text `#9A4A43`) for bugs; sage (`#2A7357`) for passes. Tints sit at 14 to 18% into white.
6. **Type is light.** Bricolage Grotesque: display 380, titles 400, supporting copy 300, small emphasis 500. Nothing heavier than 500. Display tracking -0.035em.
7. **Recesses are light grey.** Fields, code and readouts use `#F5F6F9` with a hairline; fields also get a 1px solid edge at 3:1.
8. **Motion is quiet.** The beam, the pinned story, relay packets, the phone swing-in, code lines lighting in turn, a fade-up on entry, breathing LEDs. All off under reduced motion.
9. **The 3D stays the product idea.** Pale tiles are the app's screens, the beam is the nightly run, the rose-ringed tile is the bug.
10. **Squint test:** a white page, one line of light type, one dark key, one faint 3D stack. Anything else is a candidate for removal.

---

## 3. ANTI-PATTERNS: WHAT TO NEVER DO

- No decorative ornaments: no rings, bubbles, dials, toggles, patterns or glows beyond the beam.
- No raised plates, heavy shadows or boxes around sections.
- No saturated color, no colored buttons, no gradients as fills.
- No type heavier than 500, and no all caps.
- No text contrast below 4.5:1, and no control without a visible edge.
- No mascots, faces or emoji.
- No looping motion that ignores `prefers-reduced-motion`.
- No third-party scripts, fonts or images, and no WebGL or animation libraries.
- No invented proof: no fake logos, customer counts or ratings.
- No vague or apologetic error copy. Say what to fix.

---

## 4. WORKFLOW

1. **Declare fonts:** Bricolage Grotesque (opsz and wdth axes) and Geist Mono via `next/font`.
2. **Set tokens:** `packages/ui/src/tokens.css` is the source of truth; `references/tokens.md` documents it.
3. **Build components:** specs in `references/components.md`. Use the `.nm*` classes and set only `--r` inline.
4. **Check hierarchy:** squint test above.
5. **Verify both modes:** white and near-black.
6. **Test extremes:** 375px, long URLs, reduced motion, a browser without scroll timelines.
7. **Platform-adapt:** `references/platform-mapping.md`.

---

## 5. REFERENCE FILES

| File | Contains |
|------|----------|
| `references/tokens.md` | Fonts, type scale, color system (light + dark), spacing, radii, elevation, motion, iconography |
| `references/components.md` | Buttons, surfaces, inputs, tags, accordion, 3D pieces, state patterns |
| `references/platform-mapping.md` | CSS custom properties, the surface recipe, Tailwind 4 `@theme`, font loading |
