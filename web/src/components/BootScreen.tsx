import { color } from "@/lib/theme";

/**
 * Fake boot sequence overlay shown on first paint. Purely decorative; it fades
 * out and is removed from the DOM once the animation completes.
 */
export function BootScreen({
  lines,
  progressPct,
  fading,
}: {
  lines: string[];
  progressPct: number;
  fading: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: color.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: fading ? 0 : 1,
        transition: "opacity .4s ease",
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <div style={{ fontSize: 13, color: color.muted, lineHeight: 2.1, width: 280 }}>
        {lines.map((line, i) => (
          <div key={i}>
            <span style={{ color: color.green }}>$</span> {line}
          </div>
        ))}
        <span style={{ color: color.green, animation: "pulse 1s step-end infinite" }}>▌</span>
        <div
          style={{
            marginTop: 14,
            height: 3,
            background: "rgba(255,255,255,.08)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: "linear-gradient(90deg,#38bdf8,#34d399)",
              transition: "width .35s ease",
            }}
          />
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: color.faint }}>{progressPct}%</div>
      </div>
    </div>
  );
}
