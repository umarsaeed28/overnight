# Landing page review (impeccable critique and polish)

Reviewed the built page (`apps/vibe`) at 1280px and 375px, in light and dark, against the impeccable craft floor and refuse list, and against the design direction in `landing-direction.md`.

The impeccable repo's `detect` script isn't available in this environment (the skill loaded here is the condensed version), so its anti-pattern check was done by hand against the refuse list. No automated axe run was done; contrast and structure were checked by inspection and with the Playwright smoke test.

| # | Finding | Before | After |
|---|---|---|---|
| 1 | Horizontal scroll at 375px | The sample `.feature` block widened its grid column, so the page was 421px wide on a 375px screen | Grid column and children get `min-w-0` and `grid-cols-1`; page width is now 375px. The code block scrolls inside its own box, and is keyboard focusable |
| 2 | Text typed before hydration was lost | The form validated React state, so fast typing plus Enter right after load submitted an empty value (caught by the keyboard e2e test) | The form reads the field's value from `FormData` on submit |
| 3 | Unicode glyphs used as icons | The report card used `!` and `~` as bullets, and the FAQ toggle was a `+` character | Report items are plain text with a colored bold label; the FAQ toggle is an SVG plus with a single stroke weight |
| 4 | Code sample too wide for phones | The scenario line was longer than the 343px content width | Sample shortened, so it fits without scrolling at 375px |

## Second pass: pastel anime restyle (superseded)

An anime-style pastel look was tried and rejected as too childish. Its findings (a hero that overflowed at 375px because a grid column grew to its content, and decoration sitting behind text) were fixed and carry over as `grid-cols-1` with `min-w-0` children.

## Third pass: watercolor studio (superseded)

A maximalist watercolor look was built and then replaced. Its findings still hold: decorative layers must sit behind text (positioned elements with no z-index paint over static content), and two animations must not share one element's `transform`.

## Fourth pass: soft instrument panel (neumorphism) (superseded)

Neumorphism was built with measured contrast, then replaced. One finding still applies: a theme color must not be named `base`, because Tailwind read `sm:text-base` as a color and turned the code sample invisible.

## Fifth pass: the night-shift stage (3D, immersive, bold type)

The direction is now clean UI with real 3D and immersive elements and bold type (see `landing-direction.md`). Reviewed at 1280px and 375px, light and dark, plus a reduced-motion test.

| # | Finding | Before | After |
|---|---|---|---|
| 21 | Hero stack too small to be a hero | The 3D stack was 24rem wide inside a 62%-wide scene | Stack is up to 32rem with larger layer spacing |
| 22 | Exploded layers covered the copy on phones | In the pinned story at 375px, the risen layers drew over the step text | Phones get a smaller stack, pushed 4.5rem below the text, a smaller step number, and a taller reserved text zone |
| 23 | Footer wordmark cropped horizontally | At 17vw the word "check" ran off the right edge | Sized at 12.2vw so the name reads in full; only the bottom is cropped |
| 24 | Cube overhang | A rotated cube's corner stuck out past the text margin | Cube wrappers get margin so corners stay inside the layout |
| 25 | Reduced motion and older browsers | Pinned scroll scenes usually have no fallback | With reduced motion or without scroll timelines the section is normal flow: static exploded scene, three steps visible as a list. A Playwright test checks the steps are visible, `position: static`, and the section is not a tall track |
| 26 | Dark ground on a light page | A hard cut between grounds cannot clear 4.5:1 with one accent | Accent has two stops (`#CC2B08` and `#FF6B47`) and `ground-night` restates `color`, so text re-inks |

Contrast measured on the tokens: light ground ink 17.1:1, secondary 7.1:1, accent text 4.87:1, white on accent 5.36:1, pass text 4.86:1; night ground ink 17.6:1, secondary 8.75:1, accent text 6.93:1, ink on accent 6.93:1.

Not measured: LCP and real-device frame rate. The 3D is CSS transforms only (no filters, no images, no WebGL), and the hero loop animates two registered custom properties, but a low-end phone run is still owed. Firefox lacks scroll-driven animation and falls back to the static composition.

## Sixth pass: richer hero and set pieces

| # | Finding | Before | After |
|---|---|---|---|
| 27 | "Too basic" | One 3D idea on a flat light canvas | Dark cinematic hero with floor, light, dust, glass materials and extruded type; a ticker; a solid phone; line-by-line code highlights; pointer glare |
| 28 | Dev server returned 500 | `next build` and `next dev` shared `.next`, so a build corrupted the running dev server | Dev uses `.next-dev`; verified the dev server still answers 200 after a production build |
| 29 | Sideways scroll risk on phones | Only checked by eye | A Playwright test asserts `scrollWidth <= clientWidth` at 375px |
| 30 | Labels wrapping inside the phone | "Try this:" broke onto two lines | Labels are `shrink-0` |

## Seventh pass: high-end and trustworthy

| # | Finding | Before | After |
|---|---|---|---|
| 31 | Large, obnoxious banners | A full-width accent ticker, an accent-drenched report band, an accent featured price card | All removed; accent is limited to small controls and marks |
| 32 | Product not shown | The report showed the bug but not the markdown prompt the product provides | A markdown prompt window with a working Copy button, beside the phone |
| 33 | Status region clash | A second `role="status"` (copy button) made the invalid-URL test match two elements | The test scopes to the form; the new control has its own live region |
| 34 | Sideways scroll at 375px | The prompt's long lines grew the grid column (507px wide) | Grid is `grid-cols-1` with `min-w-0` children, so the code block scrolls inside itself; the existing 375px test caught it |
| 35 | Copy fails silently | Clipboard can be blocked | Failure shows "Couldn't copy automatically. Select the text and copy it." |

## Eighth pass: the agent relay

| # | Finding | Before | After |
|---|---|---|---|
| 36 | Foreshortened labels | Station numbers on a 58 degree plane were hard to read | Upright name pills counter-rotate to face the camera and turn with the scene |
| 37 | Relay too small and pale | First render used 37rem and small tiles | Wider floor (up to 42rem), larger tiles, taller scene |
| 38 | Sideways scroll at 375px | The relay's floor plane extended 14px past the viewport (389px vs 375px); the existing 375px test caught it | The section clips horizontal overflow at the full-width wrapper |
| 39 | Animation conflicts | Two animations on one station would override each other's rest values | Each station has one keyframe set with all its active windows (the Test writer lifts twice per loop) |
| 40 | Reduced motion | Ambient loops | No packet or station animation; the picture is static. A test asserts `animation-name: none` |

## Ninth pass: claymorphism

| # | Finding | Before | After |
|---|---|---|---|
| 41 | Material | Light glass, hairlines and one heavy accent | Inflated clay everywhere: double inner and outer shadows, hue-matched shading, large radii, pastel pigments with dark ink |
| 42 | Utility override | A Tailwind arbitrary `[--c:#fff]` on a clay element did nothing, because unlayered CSS beats Tailwind's layered utilities | A dedicated `.clay-white` class; `--r` is only read, never declared, so it can still be set with `[--r:...]` |
| 43 | Soft edges hide controls | Clay shading alone makes an input hard to find | The URL field has a 3px solid edge at 3:1 or better, plus a clay coral key |
| 44 | Sphere on the headline | The first decorative sphere sat behind "checked" | Spheres moved below and beside the form |
| 45 | Legend dots too faint | 1rem clay dots nearly vanished | 1.5rem dots |

Contrast on the clay palette: ink on canvas 12.3:1, secondary 5.8:1, ink on coral 6.2:1, butter 10.1:1, mint 9.2:1, sky 7.9:1, lilac 7.6:1; accent text 5.0:1; pass text 5.4:1. Dark: ink 14.4:1, secondary 8.1:1, accent text 8.0:1.

Not measured: LCP and frame rate on a real phone (clay uses layered box-shadows; these are static, but a low-end run is still owed).

## Tenth pass: light neumorphism

| # | Finding | Before | After |
|---|---|---|---|
| 46 | Colors too sour | Saturated coral, butter and mint clay pastels | A soft periwinkle accent and dusty tints mixed 36 to 50% into the surface; bug and pass have their own muted rose and sage |
| 47 | Text too heavy | Display weight 700 to 800, bold titles, extra-bold buttons | Display 470, titles 500, small emphasis 600, nothing heavier |
| 48 | Secondary text under AA on tints | `#5A6483` gave 4.4:1 on the sky and lilac cards | Secondary ink is `#535D7C`: 4.9 to 5.8:1 on every tint |
| 49 | Bug looked like an action | The bug slab, LED and packet shared the accent | Bug is its own rose; the accent is only for actions and numbers |
| 50 | Heavy neumorphism | Large offsets, dark shadows | Small offsets, pale shadows, one `--depth` number that scales them, so groups can emerge as they scroll |

Not measured: LCP and frame rate on a real phone (many layered box-shadows and several looping animations, all transform or opacity apart from the registered custom properties).

## Eleventh pass: near-minimal

| # | Finding | Before | After |
|---|---|---|---|
| 51 | Too much going on | Rings, bubbles, dial, toggles, slider and a control deck; raised plates around sections | All removed; structure is white space and single hairlines |
| 52 | Surfaces still heavy | Raised and recessed shadow pairs on every card | White card with a hairline and a faint shadow; recesses are a light grey fill |
| 53 | Type weight | Display 470, titles 500 | Display 380, titles 400, support copy 300 |
| 54 | Input edge lost its width | A `border-2` utility was overridden by an unlayered border rule | `.nm-inset` carries no border, so the field's own edge utilities apply |
| 55 | Theme color stale | Browser chrome still used the clay colors | `#FFFFFF` light, `#0F1116` dark |

Contrast on the final tokens: ink 17.2:1, secondary 6.3:1, accent text 6.1:1, bug text 6.1:1, pass 5.7:1, input edge 3.8:1; dark: ink 16.6:1, secondary 7.8:1.

Not measured: LCP and real-device frame rate. This is the lightest page so far (no decorative loops, fewer shadows), but a low-end phone run is still owed.

## Checked and left alone
- **No eyebrow labels, no gradient text, no glass, no identical icon-card grids.** The three-step section is a real sequence, so numerals are justified; Trust and Pricing use different structures.
- **Color:** red and green appear only in the sample report and the hero ledger, where they mean fail and pass. Secondary text is tinted from the hue in both themes.
- **Motion:** the scan beam is the one motion idea (hero loop, then the scroll-driven story). `prefers-reduced-motion` and browsers without scroll timelines get a static composition.
- **Focus:** 3px ring in ink on light grounds and near-white on night grounds, with a 3px offset.
- **Keyboard:** skip link, native `<details>` for the FAQ, no traps.
- **Headers:** CSP without third-party origins; fonts self-hosted through `next/font`.

## Open for your review
- The CSP allows `'unsafe-inline'` for scripts because Next inlines its bootstrap script. A nonce-based policy is possible but forces dynamic rendering on every page.
- Copy on the sample report is illustrative, and labelled as such on the page.
