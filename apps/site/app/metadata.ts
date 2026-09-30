import type { Metadata, Viewport } from "next";

const title = "Overnight QA. Ship at dusk. Wake up to answers.";
const description =
  "AI agents test your app overnight. Engineers check every finding. Your report is ready by 7am.";

/**
 * Kept apart from the layout so tests can read it without pulling in next/font,
 * which needs the Next bundler to resolve.
 */
export const siteMetadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://overnightqa.com"),
  title,
  description,
  openGraph: { title, description, type: "website" },
};

export const siteViewport: Viewport = {
  themeColor: "#FBF8F3",
};
