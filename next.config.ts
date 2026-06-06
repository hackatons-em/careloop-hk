import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer is a heavy Node library; keep it out of the bundler so
  // server-side PDF generation works reliably.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
