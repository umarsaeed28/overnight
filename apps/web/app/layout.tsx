import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QueryProvider } from "@/components/common/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Overnight QA",
  description: "A cited knowledge layer for the application under test.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="h-dvh overflow-hidden">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
