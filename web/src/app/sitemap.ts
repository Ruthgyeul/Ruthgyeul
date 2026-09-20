import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/**
 * Bump this manually whenever content.ts (or other page content) actually
 * changes — using `new Date()` here would restamp on every build regardless
 * of whether anything changed, which misrepresents the "monthly" cadence to
 * crawlers.
 */
const LAST_MODIFIED = new Date("2026-09-20");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://ruthgyeul.xyz/",
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
