import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/** Calendly is loaded on demand, so it is allowed here but never preloaded. */
const csp = [
  "default-src 'self'",
  `script-src 'self'${isProduction ? "" : " 'unsafe-eval'"} 'unsafe-inline' https://assets.calendly.com`,
  "style-src 'self' 'unsafe-inline' https://assets.calendly.com https://fonts.googleapis.com",
  "img-src 'self' data: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://calendly.com https://*.calendly.com",
  "frame-src https://calendly.com https://*.calendly.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const config: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "content-security-policy", value: csp },
          { key: "strict-transport-security", value: "max-age=31536000; includeSubDomains" },
          { key: "x-content-type-options", value: "nosniff" },
          { key: "referrer-policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default config;
