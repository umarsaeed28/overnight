import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/**
 * No third-party origins anywhere: scripts, styles, fonts and images are all
 * same-origin (`next/font` self-hosts). `unsafe-inline` on scripts is Next's
 * inline bootstrap; dev also needs `unsafe-eval` for React refresh.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self'${isProduction ? "" : " 'unsafe-eval'"} 'unsafe-inline'`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const config: NextConfig = {
  // Dev and production builds must not share a folder: running `next build` while `next dev`
  // is up corrupts the dev server's cache and every page returns 500.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  // Workspace packages ship TypeScript source rather than a build output.
  transpilePackages: ["@oqa/ui", "@oqa/contracts"],
  webpack(config) {
    // The packages use NodeNext-style `./x.js` specifiers that resolve to `./x.ts`.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "content-security-policy", value: csp },
          { key: "strict-transport-security", value: "max-age=31536000; includeSubDomains" },
          { key: "x-content-type-options", value: "nosniff" },
          { key: "referrer-policy", value: "no-referrer" },
          { key: "permissions-policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "cross-origin-opener-policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default config;
