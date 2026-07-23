import type { ReactNode } from "react";
import { color } from "@/lib/theme";
import { TerminalBar } from "./TerminalBar";

interface DetailRow {
  key: string;
  value: string;
  valueColor?: string;
}

/**
 * Shared terminal-styled error page used by both 404 and 500.
 * The visual language matches the approved 404/500 mockups.
 */
export function ErrorScreen({
  command,
  code,
  codeColor,
  message,
  details,
}: {
  command: ReactNode;
  code: string;
  codeColor: string;
  message: string;
  details: DetailRow[];
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: color.bg }}>
      <TerminalBar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ maxWidth: 520, width: "100%" }}>
          <div style={{ fontSize: 13, color: color.muted, marginBottom: 6 }}>
            jaeah@ruthgyeul<span style={{ color: color.faint }}>:~$</span> {command}
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, color: codeColor, lineHeight: 1, margin: "18px 0 8px" }}>
            {code}
          </div>
          <div style={{ fontSize: 15, color: color.textDim, marginBottom: 18 }}>{message}</div>
          <div
            style={{
              background: color.card,
              border: `1px solid ${color.border}`,
              borderRadius: 8,
              padding: "16px 18px",
              fontSize: 12.5,
              lineHeight: 1.8,
              color: color.muted,
            }}
          >
            {details.map((d) => (
              <div key={d.key}>
                <span style={{ color: color.pink }}>{d.key}</span>:{" "}
                <span style={{ color: d.valueColor ?? color.lime }}>{d.value}</span>
              </div>
            ))}
          </div>
          {/* Plain anchor on purpose: a full reload cleanly resets error state. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: 22,
              background: "rgba(255,255,255,.03)",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 6,
              padding: "10px 16px",
              fontSize: 13,
              color: color.text,
              textDecoration: "none",
            }}
          >
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
