import type { NextConfig } from "next";

/**
 * Server build for self-hosting.
 *
 * The site runs as a long-lived Node process (`next start`) behind a reverse
 * proxy on our own server, managed by systemd (DefaultWeb.service). We do NOT
 * use `output: "export"` — that produces static files `next start` cannot serve.
 *
 * All pages are statically prerendered at build time (they're client
 * components), so the running server mostly just serves cached HTML — cheap and
 * fast — while still letting us add server features (headers, API routes,
 * revalidation) later without re-architecting.
 *
 * Run with `next start` (see package.json `start` script), which the systemd
 * unit DefaultWeb.service invokes via `npm run start`.
 */
const nextConfig: NextConfig = {
  // Don't advertise the framework/version.
  poweredByHeader: false,

  // We render no next/image elements; keep image optimization (and its native
  // `sharp` dependency) out of the runtime.
  images: { unoptimized: true },

  // Fail the build on type or lint errors so broken deploys never ship.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  // Security headers, applied by the Node server to every response.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), camera=(), microphone=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
