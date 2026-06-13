import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

// Content-Security-Policy. 'unsafe-inline' script/style is required by the
// Next.js inline runtime + Mermaid/Recharts inline styles; nonce-based CSP is a
// future tightening. connect-src allows Supabase (auth session from the
// browser) and Sentry ingest when configured.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Inline the (small, ~16KB) stylesheet into the document: removes the
  // render-blocking CSS request from the LCP critical chain.
  experimental: { inlineCss: true },
  // @react-pdf/renderer is a heavy Node library; keep it out of the bundler so
  // server-side PDF generation works reliably.
  serverExternalPackages: ["@react-pdf/renderer"],
  // The Arabic PDF font (lib/pdf-fonts) is read from disk at render time
  // (lib/pdfFonts.ts). Force the file-tracer to bundle it into the PDF route
  // functions so Arabic glyphs render in production (not just locally).
  outputFileTracingIncludes: {
    "/api/program/pdf": ["./lib/pdf-fonts/**"],
    "/api/patients/[id]/pdf": ["./lib/pdf-fonts/**"],
  },
  // Self-host story: `docker build` uses the standalone server output.
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

// Source maps upload only when SENTRY_AUTH_TOKEN is present (Vercel <-> Sentry
// integration); CI and local builds stay clean without it.
export default withSentryConfig(withNextIntl(nextConfig), {
  silent: true,
  telemetry: false,
  disableLogger: true,
});
