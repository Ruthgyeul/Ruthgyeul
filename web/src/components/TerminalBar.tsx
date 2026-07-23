import { color } from "@/lib/theme";

const dot = (bg: string) => (
  <span
    style={{ width: 10, height: 10, borderRadius: 999, background: bg }}
  />
);

/**
 * The macOS-style window chrome bar shown at the top of every page.
 * `sticky` pins it (main dashboard); `branch` renders the git-branch chip.
 */
export function TerminalBar({
  sticky = false,
  branch,
}: {
  sticky?: boolean;
  branch?: string;
}) {
  return (
    <div
      style={{
        position: sticky ? "sticky" : "relative",
        top: sticky ? 0 : undefined,
        zIndex: 20,
        height: 38,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 20px",
        background: sticky ? "rgba(13,17,25,.9)" : color.bgPanel,
        backdropFilter: sticky ? "blur(6px)" : undefined,
        borderBottom: `1px solid ${color.borderSoft}`,
      }}
    >
      {dot(color.red)}
      {dot(color.yellow)}
      {dot(color.green)}
      <span style={{ marginLeft: 10, fontSize: 12, color: color.faint }}>
        jaeah@ruthgyeul <span style={{ color: color.fainter }}>—</span> ~/portfolio{" "}
        <span style={{ color: color.fainter }}>—</span> zsh
      </span>
      {branch && (
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: color.faint,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color.faint} strokeWidth="2">
            <circle cx="6" cy="6" r="2.2" />
            <circle cx="6" cy="18" r="2.2" />
            <circle cx="18" cy="12" r="2.2" />
            <path d="M6 8.2v7.6M6 6h6a4 4 0 014 4" />
          </svg>
          {branch}
        </span>
      )}
    </div>
  );
}
