import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

// Self-hosted at build time: no request to Google is made from the browser.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-bricolage",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vibe Check: your app, checked every night",
  description:
    "Paste your link. Vibe Check writes the tests, runs them every night, and emails you what broke in plain English.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1116" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
