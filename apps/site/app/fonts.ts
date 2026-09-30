import { Inter, Zen_Maru_Gothic } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export const zenMaruGothic = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-zen-maru-gothic",
  display: "swap",
});

/**
 * Decorative kanji only. next/font cannot subset by character, so this one is
 * requested straight from the font CSS API with a text parameter covering the
 * three glyphs the page draws. It costs a few hundred bytes instead of a
 * megabyte of Japanese.
 */
export const KANJI_ON_THE_PAGE = "夕夜朝";

export const kanjiStylesheetHref =
  "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500" +
  `&text=${encodeURIComponent(KANJI_ON_THE_PAGE)}&display=swap`;

export const fontVariables = [inter.variable, zenMaruGothic.variable].join(" ");
