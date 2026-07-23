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
/**
 * Content-Security-Policy — defense-in-depth for a site that takes no user
 * input. The site loads only its own assets (self-hosted fonts, images and the
 * inline JSON-LD / Next.js bootstrap scripts), so everything can stay on
 * `'self'` with no external origins allowed.
 *
 * `'unsafe-inline'` is required for two reasons we cannot avoid on a statically
 * prerendered App-Router site: React inline `style={{…}}` attributes (style-src)
 * and Next.js's inline hydration/bootstrap scripts (script-src) — nonces need
 * per-request dynamic rendering, which this static site deliberately avoids.
 * `'unsafe-eval'` is added only in `next dev`, where React Fast Refresh needs it;
 * production never allows eval.
 */
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "connect-src 'self'",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  // Don't advertise the framework/version.
  poweredByHeader: false,

  // We render no next/image elements; keep image optimization (and its native
  // `sharp` dependency) out of the runtime.
  images: { unoptimized: true },

  // Fail the build on type errors so broken deploys never ship. (Next 16
  // removed the build-time ESLint integration; linting runs separately via the
  // `lint` script in CI — see .github/workflows/ci.yml.)
  typescript: { ignoreBuildErrors: false },

  // Security headers, applied by the Node server to every response.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Isolate our browsing context from any window that opens us / that we
          // open, and block cross-origin embedding of our resources.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
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
