import type { ReactNode } from "react";
import { fontVariables, kanjiStylesheetHref } from "./fonts";
import { siteMetadata, siteViewport } from "./metadata";
import { WashiTexture } from "../components/art/WashiTexture";
import "./globals.css";

export const metadata = siteMetadata;
export const viewport = siteViewport;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Three decorative glyphs, requested by name so nothing else ships. */}
        <link rel="stylesheet" href={kanjiStylesheetHref} />
      </head>
      <body className="relative min-h-screen bg-washi antialiased">
        <WashiTexture />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
