# Landing direction: the night-shift stage (3D, immersive, bold type)

Fifth pass, enriched in a sixth (see "Sixth pass" at the end). Earlier passes (cobalt ledger, pastel anime, watercolor, neumorphism) were judged too corporate, too childish or too quiet. The brief now: clean UI, real 3D and immersive elements, bold typography, design that pops. The product truth is unchanged: paste a link, get a plain-English bug report every morning.

## Skills applied
- **frontend-design / impeccable:** one committed world; category defaults skipped (dark terminal with neon, cream editorial); one accent; type does the personality; no eyebrow labels, gradient text or identical icon-card grids.
- **claude-design:** system declared here before building; no faux illustration. Everything visual is built from the product's own idea, not stock art.
- **epic-design:** a six-level depth model. Layers at different depths visibly separate; the exploded stack is the depth system made literal. Reduced motion is handled per effect, not by killing everything.
- **scroll-craft:** a pinned scrollytelling stage ("world" built from independent planes), art-directed separately for mobile, with a complete static fallback. One signature moment, engineered as the peak of the page.
- **responsive-craft:** fluid `clamp()` type, `svh` units, and a phone composition that is recomposed rather than shrunk (the stack drops below the copy so exploded layers never cover text).
- **interface-design:** tokens named for the world (`--canvas`, `--night`-style grounds, `--accent`), hierarchy by weight and size, states designed rather than defaulted.
- **hue:** codified as `.claude/skills/vibe-check-design`.
- **ui-ux-pro-max:** used for its accessibility and interaction checklist only. Its style database has no entry for this direction.

## The world
The product's unique mechanism in one sentence: a beam of light passes through every screen of your app at night and stops on the one that is broken. The page is built on that picture. Your app is a **stack of glass screens in 3D space**; the nightly run is a **scan plane** that rises through them; the bug is the layer that **lights up**.

## The rut, and what we skip
Dev-tool pages: near-black with neon green, or a flat gradient blob hero. Instead: a light, clean canvas with a real 3D object, and one dark, immersive stretch only where the story plays.

## Color: one accent, two grounds
| Token | Light | Dark / night ground | Role |
|---|---|---|---|
| canvas | `#F2F4F9` | `#0A0D16` | page |
| surface | `#FFFFFF` | `#131829` | sheets, glass |
| ink | `#0D111C` | `#F1F4FB` | text (never pure black) |
| ink-soft | `#485268` | `#A5AEC6` | secondary text (tinted, not grey) |
| accent | `#CC2B08` | `#FF6B47` | primary key, the scan beam, the bug, one drenched band |
| accent-ink | `#FFFFFF` | `#0A0D16` | text on the accent |
| pass | `#0B7A54` | `#4FE0A6` | passes only |
| line-strong | ink at 30% | ink at 32% | dividers |

The light and dark grounds hard-cut down the page, so the accent has two stops (one hue, two lightnesses). `ground-night` restates `color` as well as the tokens, so text under it re-inks.

## Type
- **Archivo** (Google Fonts through `next/font`), variable, with the width axis. Display is weight 900, `wdth` 112, tracking -0.055em, leading 0.92, sized up to 144px. It is heavy and expanded, so type itself pops.
- **Geist Mono** for the `.feature` sample only. Two families, no more.
- Body 18 to 24px, ink-soft, measure 42 to 62ch. On phones the hero steps down to 3.1rem.

## Layout and moments
1. **Hero (light):** the headline runs across the edge of a big 3D stack. Pointer parallax turns the stack slightly; the scan beam sweeps up and down through it on a loop and glows the checkout layer as it passes.
2. **How it works (night, pinned, 340vh):** the stage sticks and plays as you scroll. Step 1: layers stacked (paste your URL). Step 2: they come apart and gain test chips (we write your tests). Step 3: the beam sweeps up, the camera turns, and it stops on the buggy layer (we run them nightly). Progress bar along the bottom.
3. **Report (accent-drenched):** one huge statement, then the email unfolds from a tilted plane to flat as it arrives, and tilts toward the pointer.
4. **You own the tests:** the feature file on a dark slab with a solid accent edge behind it, like a thick block.
5. **Safe by default (night):** three real six-faced CSS cubes, each with a tick, turning slowly.
6. **Pricing:** two big tilting cards. The nightly plan is the accent block; the price is the loudest type on the page.
7. **FAQ:** heavy hairline accordion. **Footer (night):** the wordmark at title-card scale.

## Signature detail
The scan beam. It appears in the hero as ambient motion, in the story as the payoff (it stops on the bug), and in the footer of the idea as the accent colour. The only sequence a visitor has to sit through is the one that shows what the product does.

## Wordmark
"vibe" and "check" in Archivo 900 expanded lowercase, with a solid accent tile (tilted 6 degrees) holding a white tick between them. A type treatment plus one shape.

## Accessibility and motion
- Text contrast (measured): body 17.1:1, secondary 7.1:1, accent text on canvas 4.87:1, white on accent 5.36:1; night ground: ink 17.6:1, secondary 8.75:1, accent text 6.93:1.
- The URL field has a solid 2px ink edge, not a faint shadow.
- Decorative 3D is `aria-hidden` or a single labelled `img`; the words carry the meaning.
- `prefers-reduced-motion`: no ambient loop, no pointer parallax, no tilt, no pinned track. The stack is a static exploded pose with the beam held on the bug, and the three steps read as an ordinary list. A test guards this.
- Browsers without scroll timelines (older Firefox) get the same static fallback.

## Principles
1. The 3D is the product idea, not decoration. Layers are screens; the beam is the nightly run.
2. Bold type, clean surface. Weight and scale make it pop; nothing else competes.
3. One accent, two grounds, no gradients as fills.
4. Immersion earns its scroll: the pinned story is the one long sequence, and it explains the product.

## Sixth pass: "too basic" became cinematic

The fifth pass had one strong idea and plain execution around it. This pass keeps the idea and adds richness in materials, atmosphere and set pieces:
- **Hero is a night scene.** Dark ground, warm accent light, a grid floor in perspective, a soft light that follows the pointer, and rising dust motes. The headline is extruded: its letters step back through darker accent shades, like chunky 3D type.
- **Real glass.** Layers have a lit top edge, an inner highlight, a diagonal sheen that slides as the stack turns, and a shadow on the floor under the stack.
- **A ticker** in a full-width accent band sets last night's check names huge, each with a tick or a cross. It is decorative; a screen-reader sentence says what it shows.
- **A solid 3D phone** shows the email. It has visible thickness (two offset layers behind it), swings into place as it scrolls in, overlaps the accent band above it, and carries a glare that follows the pointer.
- **The feature file lights up line by line** (Given, When, Then) as you scroll past it.
- **Glare** on the code slab, the pricing cards and the phone.

What stayed the same: one accent with two stops, Archivo 900 display, pure CSS 3D with no libraries, and the full reduced-motion and no-scroll-timeline fallbacks. Every added loop (dust, ticker, sheen, pointer light) is off under reduced motion.

## Seventh pass: high-end and trustworthy, and what the product hands you

Two corrections. First, the product: Vibe Check gives you **markdown prompts** to paste into Claude Code, Codex, Cursor or any AI builder. The report now shows that, with a real prompt and a copy button. Second, the tone: the loud pieces made the page feel like an ad, so they are gone.

**Removed:** the full-width accent ticker, the accent-drenched "Your morning report" band, the extruded headline, the solid-accent featured price card, the accent slab behind the code, the spinning cubes, and the giant footer wordmark.

**Changed:**
- Display type is weight 760 at natural width (was 900 and expanded), tracking -0.045em, hero topping out at 7rem. Section headings top out at 4.75rem.
- The accent is now small and deliberate: the Go key, the beam and the bug, inline labels, the wordmark tile. Never a block.
- The hero glow, grid floor and dust are dialed down (dust 26 to 12 motes, glow and floor roughly halved).
- Trust is three hairline-divided columns with thin outlined ticks, not cubes.
- Pricing is one dark card and one white card.
- Sections have more air (bottom padding up to 10rem) and hairline structure.

**Added:** "Every bug comes with a prompt": a markdown file window (`fix-checkout-pay-button.md`) with what broke, how to reproduce, expected, actual, which test covers it, and constraints, plus a Copy prompt button with a live "Copied" status. The phone with the email sits beside it.

Trust is earned by restraint and specifics: no invented logos, customers, counts or badges, and every claim on the page is one the product actually makes.

## Eighth pass: the agentic QA system

A new section, "Four agents. One job each.", explains how the system works after the pinned story and before the report.

**The content** stays inside what the product is known to do. Four agents hand work along a track:
1. **Explorer:** explores your app like a new visitor would.
2. **Test writer:** saves what it learned as Cucumber tests in your own GitHub repo.
3. **Runner:** runs every test each night, then works out whether a failure is a real bug or a test that has gone out of date.
4. **Reporter:** writes the morning email in plain English, real bugs first, each with a markdown prompt for your coding agent.

The split after the Runner is what makes it agentic: a real bug goes on to the Reporter, and an out-of-date test loops back to the Test writer to be updated. No model names, timings, accuracy figures or guarantees are claimed.

**The picture** is a relay on an isometric glass floor. Four raised stations sit on a dashed track with a return loop. Two glowing packets travel it on a 14 second loop: an accent one for the real bug, and a green one for the stale test, which takes the return track. Each station lifts and lights as work reaches it, name labels stand upright and face the camera, and the whole relay turns a little as the section scrolls in. Hovering an agent in the list lifts its station. It is pure CSS 3D with registered custom properties (`--lift`, `--turn`). Under reduced motion it is a still picture with the packets parked at the Reporter and the Test writer.

## Ninth pass: claymorphism (whole site)

Requested explicitly: the whole site in claymorphism. Everything is now soft, inflated clay: rounded 2 to 3rem surfaces with a bright rim at the top left, a darker hue-matched shade at the bottom right, and a soft drop shadow underneath. The content, structure, 3D scenes and motion from the earlier passes are kept; only the material changed.

**The material** (`packages/ui/src/tokens.css`): `.clay` sets a colour (`--c`), a radius (`--r`) and a double shadow (outer drop plus inner highlight and inner shade, mixed from the clay colour). `.clay-well` is a recess for fields and readouts, `.clay-press` is a soft press with a little bounce (cubic-bezier 0.34, 1.56, 0.64, 1, 240ms), and `.clay-acc` turns an open accordion bar into a recess.

**Palette:** a periwinkle canvas (`#EDF0FC`), five pastel clay pigments (coral `#FF8D6E`, butter `#FFD778`, mint `#8EE3BE`, sky `#8EC9FF`, lilac `#C4B6FF`) that all carry the same dark ink (`#262A47`), and a deep indigo clay ground (`#23264A`) for the story, code windows and footer. Dark mode deepens the canvas to `#1B1E36` and dims the highlight; the pastels stay.

**Type:** Bricolage Grotesque (width and optical-size axes) at weight 800. Headings get a soft emboss: a white rim line and a faint hue-matched shadow, so the letters look pressed up from the surface.

**Where clay shows up:** the URL field is a recess with a real 3px edge and a coral clay Go key; the five app screens in the 3D stack are pastel clay slabs; decorative clay spheres float behind the hero; the story runs in a large indigo clay panel with an inset progress track; the agent relay sits on a clay floor with pastel clay stations and glossy clay packets; the phone is a lilac clay object with visible thickness; trust is three pastel clay cards; pricing is a lilac and a butter card; the FAQ is raised bars that sink when opened; the footer is an indigo clay plate.

**Kept deliberate:** clay is playful by nature, and an earlier pass was rejected as too childish. To keep it grown-up: muted pastels, dark ink type, generous whitespace, one weight of display type, and no mascots or cartoon shapes.

**Accessibility (clay's weak spot is soft edges):** measured text contrast, ink on canvas 12.3:1, secondary text 5.8:1, ink on each pastel 6.2 to 10.1:1, accent text 5.0:1, pass text 5.4:1; dark mode ink 14.4:1, secondary 8.1:1. Inputs carry a 3px solid edge (`#666B8C`) because shadow alone is not a 3:1 boundary. Focus is a 4px ring with a 3px offset. All loops and the soft-press bounce are off under reduced motion.

## Tenth pass: light neumorphism, airy and animated, with a little maximalism

Requested: neumorphism, but light rather than heavy, airy, animated, and a little maximalist. Two corrections followed straight away: the colors were too sour and the text too heavy, so both were softened.

**The material** (`packages/ui/src/tokens.css`): one surface color, with depth from a pale light shadow and a soft dark one. Offsets are small (7px raised, 4px small, 5px inset) and every raised shadow scales with a registered `--depth` number, so a whole group can emerge from flat to raised as it scrolls in (`.nm-emerge`). Classes: `.nm`, `.nm-sm` (raised), `.nm-inset`, `.nm-inset-sm` (recessed), `.nm-key` (the one solid accent key), `.nm-press` (soft press with a little bounce), `.nm-acc` (accordion that sinks open), and five dusty tints (`.nm-sky`, `.nm-mint`, `.nm-butter`, `.nm-lilac`, `.nm-coral`).

**Color, softened:** periwinkle-white canvas `#EDF1F8`, dark-slate ink `#2B3450`, a soft periwinkle accent `#9DB2E0` (accent text `#3F5294`), and dusty tints: sky `#A9C4E8`, mint `#A9D3C2`, butter `#E6D6AA`, rose `#E2B5B0`, lilac `#C5BEE3`. A bug is its own muted rose (`#D29A94`, text `#9A4A43`) and a pass is muted sage (`#2A7357`), so neither reads as an action. Dark mode is a soft dark slate with dimmer highlights.

**Type, lightened:** Bricolage Grotesque at weight 470 for display (was 700 to 800), 500 for titles, 600 only for small emphasis; nothing above 600. Display tracking -0.03em with a faint letterpress highlight.

**A little maximalism, all animated and all decorative:**
- Pulsing rings radiating from the hero stack and from the agent relay.
- A dotted field fading across the hero, and four pale floating bubbles.
- A control deck: a dial with tick marks and a sweeping needle, two toggles that flip on a loop, a slider whose knob drifts, and three LEDs that breathe. A smaller version sits in the footer.
- The pinned story, the agent relay, the phone, the scan beam and the soft press from earlier passes, now in the soft material.
- Cards and groups emerge from the surface as they scroll into view.

**Accessibility:** measured with the final tokens: ink on canvas 10.8:1; secondary text 4.9 to 5.8:1 on every surface and tint; accent text 5.2 to 6.5:1; bug text 5.0:1; pass text 4.6:1; ink on the accent key 6.2:1; dark mode secondary 6.7:1 and accent text 7.7:1. The URL field has a 2px solid edge (`#6B7594`, 4.0:1) because soft shadows are not a 3:1 boundary. All loops, the emerge and the bounce are off under reduced motion, with the ornaments left as still pictures.

## Eleventh pass: white space, light, almost minimal

Requested: make it white space and light, almost minimal. The soft raised-and-pressed material from the last pass is reduced to a whisper: a white page, hairlines, and the faintest shadow. The decorative maximalism is removed. What stays is the one idea that explains the product, the 3D tile stack and the agent relay, now pale and thin.

**Removed:** the pulsing rings, dotted field, bubbles, the dial, toggles and slider, the control deck in the hero and footer, the raised plate around the story, the card rows in the agent list and trust section, and the raised FAQ bars.

**The surfaces** (`packages/ui/src/tokens.css`): `.nm` is a white card with a 1px hairline and a very faint shadow; `.nm-sm` is the same with no lift; `.nm-inset` is a light grey field (`#F5F6F9`) for things you read or type into; five tints (`.nm-sky` and the rest) are a pigment at 14 to 18% into white; `.nm-key` is ink on the page color. The class names from the neumorphic pass were kept so the components stay the same, and only their material changed.

**Color:** white canvas, ink `#171B26`, secondary `#5A6072`. One solid key in ink (white in dark mode). The periwinkle accent `#7B8FD8` (text `#4A5BB5`) is only for small marks: numbers, the beam and LEDs. A bug is a muted rose and a pass a muted sage, as before. Dark mode is near-black (`#0F1116`) with the same structure.

**Type:** Bricolage Grotesque at weight 380 for display, 400 for titles and 300 for supporting copy; nothing heavier than 500. Section headings top out at 3.75rem and the hero at 5.75rem.

**Layout:** sections are separated by white space (up to 14rem) and single hairlines, not by boxes. Lists are rows between hairlines; trust is three columns between hairlines; the FAQ is a hairline accordion; the story runs directly on the page between two hairlines with a one-pixel progress line.

**Motion kept, quietly:** the scan beam, the pinned story, the relay packets, the phone swing-in, the code lines lighting in turn, a fade-up as sections enter, and breathing LEDs in the pills. All of it is off under reduced motion.

**Accessibility (measured):** ink on white 17.2:1; secondary 6.3:1 (5.8:1 on the grey field); accent text 6.1:1; bug text 6.1:1; pass 5.7:1; input edge 3.8:1 on white; dark mode ink 16.6:1, secondary 7.8:1, edge 5.2:1. Inputs keep a 1px solid edge because a hairline shadow is not a 3:1 boundary.
