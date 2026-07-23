import { ImageResponse } from "next/og";

/**
 * Shared Open Graph / Twitter card image generator.
 *
 * Rendered at build/request time by Next.js for the `opengraph-image` and
 * `twitter-image` file conventions, so the site ships a proper 1200×630 social
 * preview without committing a binary asset. The look mirrors the site's
 * terminal aesthetic (dark background, accent cyan, mono type).
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Jaeah Lee — Full-Stack Developer";

export function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0d13",
          color: "#e5e7eb",
          padding: "72px 80px",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#38bdf8", fontSize: 30 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: "#34d399",
            }}
          />
          ruthgyeul.xyz
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 40, color: "#6b7280" }}>이재아 / Jaeah Lee</div>
          <div style={{ display: "flex", fontSize: 80, fontWeight: 700, lineHeight: 1.05 }}>
            Full-Stack Developer
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "#9ca3af", maxWidth: 900 }}>
            Web3 · Blockchain · Cloud — Inha University CSE
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 26, color: "#38bdf8" }}>
          {["TypeScript", "React", "Next.js", "Solidity", "AWS"].map((s) => (
            <div
              key={s}
              style={{
                display: "flex",
                border: "1px solid #1f2937",
                borderRadius: 8,
                padding: "8px 18px",
                color: "#9ca3af",
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
