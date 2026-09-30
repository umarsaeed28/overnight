# vibe-check: Platform Mapping

This language is web-only (Next.js + Tailwind 4), so there is no SwiftUI section.

## 1. HTML / CSS / WEB

### Font Loading

In this repo, fonts load through `next/font` so they are self-hosted at build time and the browser makes no request to a font CDN:

```ts
import { Bricolage_Grotesque, Geist_Mono } from "next/font/google";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz", "wdth"], variable: "--font-bricolage", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
```

Outside this repo, the plain HTML form is:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&family=Geist+Mono&display=swap" rel="stylesheet">
```

### CSS Custom Properties: Primary Mode

```css
:root {
  /* Colors */
  --background: #FFFFFF;
  --bg: var(--background);
  --surface1: #FFFFFF;
  --surface2: #F5F6F9;
  --surface3: #E9EBF1;
  --border: #E9EBF1;
  --border-visible: #7C8294;
  --text1: #171B26;
  --text2: #5A6072;
  --text3: #5A6072;
  --text4: #9AA0B2;
  --accent: #7B8FD8;
  --accent-subtle: #F3F5FC;
  --success: #2A7357;
  --success-bg: #E6F2EC;
  --warning: #7A5A00;
  --warning-bg: #F6F0DE;
  --error: #9A4A43;
  --error-bg: #F8EEEC;

  /* Tints (used at 14 to 18% into white) */
  --tint-sky: #A9C4E8;
  --tint-mint: #A9D3C2;
  --tint-butter: #E6D6AA;
  --tint-rose: #E2B5B0;
  --tint-lilac: #C5BEE3;

  /* Fonts */
  --font-display: "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* Type Scale */
  --text-display: clamp(2.6rem, 6.6vw, 5.75rem);
  --text-heading: clamp(2.25rem, 4.4vw, 3.75rem);
  --text-subheading: 1.5rem;
  --text-body: 1.25rem;
  --text-body-sm: 1.125rem;
  --text-caption: 0.875rem;
  --text-label: 0.875rem;

  /* Spacing */
  --space-2xs: 2px;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  --space-4xl: 96px;

  /* Radii */
  --radius-cards: 24px;
  --radius-buttons: 14px;
  --radius-buttons-sm: 12px;
  --radius-inputs: 20px;
  --radius-tags: 999px;
  --radius-modals: 24px;

  /* Motion */
  --ease-fast: ease-out;
  --ease-medium: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-slow: ease-in-out;
  --duration-fast: 200ms;
  --duration-medium: 220ms;
  --duration-slow: 9s;

  /* Shadows */
  --shadow-1: 0 1px 2px rgb(23 27 38 / 0.04);
  --shadow-2: 0 1px 2px rgb(23 27 38 / 0.04), 0 18px 40px -22px rgb(23 27 38 / 0.1);
  --shadow-3: 0 10px 24px -14px rgb(23 27 38 / 0.5);
}
```

### Secondary Mode

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0F1116;
    --bg: var(--background);
    --surface1: #0F1116;
    --surface2: #171A22;
    --surface3: #20242E;
    --border: #23262F;
    --border-visible: #7F869A;
    --text1: #EEF0F6;
    --text2: #A0A6B8;
    --text3: #A0A6B8;
    --text4: #6E7488;
    --accent: #8FA6D8;
    --accent-subtle: #171C3A;
    --success: #8CCFB2;
    --success-bg: #183A2D;
    --warning: #FFD86B;
    --warning-bg: #3D2C00;
    --error: #E4A39C;
    --error-bg: #3A2220;
    --shadow-1: 0 1px 2px rgb(0 0 0 / 0.4);
    --shadow-2: 0 1px 2px rgb(0 0 0 / 0.4), 0 18px 40px -22px rgb(0 0 0 / 0.5);
    --shadow-3: 0 10px 24px -14px rgb(0 0 0 / 0.6);
  }
}

/* Class-based toggle alternative */
.dark {
  --background: #0F1116;
  --bg: var(--background);
  --surface1: #0F1116;
  --surface2: #171A22;
  --surface3: #20242E;
  --border: #23262F;
  --border-visible: #7F869A;
  --text1: #EEF0F6;
  --text2: #A0A6B8;
  --text3: #A0A6B8;
  --text4: #6E7488;
  --accent: #8FA6D8;
  --accent-subtle: #171C3A;
  --success: #8CCFB2;
  --success-bg: #183A2D;
  --warning: #FFD86B;
  --warning-bg: #3D2C00;
  --error: #E4A39C;
  --error-bg: #3A2220;
  --shadow-1: 0 1px 2px rgb(0 0 0 / 0.4);
  --shadow-2: 0 1px 2px rgb(0 0 0 / 0.4), 0 18px 40px -22px rgb(0 0 0 / 0.5);
  --shadow-3: 0 10px 24px -14px rgb(0 0 0 / 0.6);
  color: var(--text1);
  background: var(--background);
}
```

### The surface recipe

```css
.nm { background: var(--surface1); border: 1px solid var(--border); border-radius: var(--r, 1.5rem); box-shadow: var(--shadow-2); }
.nm-inset { background: var(--surface2); border-radius: var(--r, 1.25rem); }   /* no border here: fields set their own */
.nm-key { background: var(--text1); color: var(--background); border-radius: var(--r, 1rem); box-shadow: var(--shadow-3); }
.nm-press { transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1); }
.nm-press:hover { transform: translateY(-1px); }
.nm-press:active { transform: scale(0.99); }
```

Unlayered component CSS beats Tailwind's layered utilities, so a class that declares a border must not be combined with border utilities; set colors with variant classes, and only `--r` inline.

---

## 2. REACT / TAILWIND

In this repo Tailwind 4 reads tokens from `packages/ui/src/tokens.css` (`@theme inline`), not a config file. The equivalent config for a Tailwind 3 project:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: { 1: "var(--surface1)", 2: "var(--surface2)", 3: "var(--surface3)" },
        border: { DEFAULT: "var(--border)", visible: "var(--border-visible)" },
        text: { 1: "var(--text1)", 2: "var(--text2)", 3: "var(--text3)", 4: "var(--text4)" },
        accent: { DEFAULT: "var(--accent)", subtle: "var(--accent-subtle)" },
        success: { DEFAULT: "var(--success)", bg: "var(--success-bg)" },
        warning: { DEFAULT: "var(--warning)", bg: "var(--warning-bg)" },
        error: { DEFAULT: "var(--error)", bg: "var(--error-bg)" },
        tint: {
          sky: "var(--tint-sky)",
          mint: "var(--tint-mint)",
          butter: "var(--tint-butter)",
          rose: "var(--tint-rose)",
          lilac: "var(--tint-lilac)",
        },
      },
      fontFamily: {
        display: ["Bricolage Grotesque", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Bricolage Grotesque", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
      fontSize: {
        display: ["clamp(2.6rem, 6.6vw, 5.75rem)", { lineHeight: "1.02", letterSpacing: "-0.035em" }],
        heading: ["clamp(2.25rem, 4.4vw, 3.75rem)", { lineHeight: "1.02", letterSpacing: "-0.035em" }],
        subheading: ["1.5rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        body: ["1.25rem", { lineHeight: "1.6", letterSpacing: "0" }],
        "body-sm": ["1.125rem", { lineHeight: "1.6", letterSpacing: "0" }],
        caption: ["0.875rem", { lineHeight: "1.5", letterSpacing: "0" }],
        label: ["0.875rem", { lineHeight: "1.4", letterSpacing: "0" }],
      },
      spacing: {
        "2xs": "2px", xs: "4px", sm: "8px", md: "16px", lg: "24px",
        xl: "32px", "2xl": "48px", "3xl": "64px", "4xl": "96px",
      },
      borderRadius: {
        cards: "24px", buttons: "14px", "buttons-sm": "12px",
        inputs: "20px", tags: "999px", modals: "24px",
      },
      transitionTimingFunction: {
        fast: "ease-out",
        medium: "cubic-bezier(0.22, 1, 0.36, 1)",
        slow: "ease-in-out",
      },
      transitionDuration: { fast: "200ms", medium: "220ms", slow: "9s" },
      boxShadow: {
        1: "var(--shadow-1)",
        2: "var(--shadow-2)",
        3: "var(--shadow-3)",
      },
    },
  },
  plugins: [],
};
```

### Font Loading

Use `next/font` as shown in section 1. Do not add a `<link>` to a font CDN in this repo: the CSP allows same-origin fonts only.

### CSS Variables

Include the `:root` custom properties from section 1 in your global stylesheet. In this repo they live in `packages/ui/src/tokens.css` and are imported by `apps/vibe/app/globals.css`.
