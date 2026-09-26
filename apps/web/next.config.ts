import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/** Section 23. `unsafe-inline` styles are required by Next's inlined critical CSS. */
const csp = [
  "default-src 'self'",
  `script-src 'self'${isProduction ? "" : " 'unsafe-eval'"} 'unsafe-inline'`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  `connect-src 'self' ${process.env.API_URL ?? "http://localhost:4000"}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const config: NextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source rather than a build output.
  transpilePackages: ["@oqa/core", "@oqa/db"],
  webpack(config) {
    // Those packages use NodeNext-style `./x.js` specifiers that resolve to
    // `./x.ts`. tsc, tsx and Vitest understand that; webpack needs telling.
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
        ],
      },
    ];
  },
};

export default config;
