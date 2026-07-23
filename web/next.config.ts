import type { NextConfig } from "next";

/**
 * Static export configuration.
 *
 * The site is a fully static, client-rendered dashboard, so we export to plain
 * HTML/JS and serve it from a CDN (Cloudflare Pages). This gives us:
 *   - Availability: no origin server to fall over; served from Cloudflare's edge.
 *   - Scalability: static assets scale trivially on a CDN.
 *   - Sustainability: no runtime infra to maintain or pay for.
 */
const nextConfig: NextConfig = {
  output: "export",
  // Emit each route as a folder with index.html so clean URLs work on any static host.
  trailingSlash: true,
  images: {
    // next/image optimization needs a server; disable it for static export.
    unoptimized: true,
  },
  // Fail the build on type or lint errors so broken deploys never ship.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
};

export default nextConfig;
