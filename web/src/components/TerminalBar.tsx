import { TERMINAL_BAR_HEIGHT } from "@/lib/layout";

const dot = (className: string) => (
  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${className}`} />
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
      className={`z-20 flex items-center gap-2 overflow-hidden border-b border-border-soft px-3 sm:px-5 ${
        sticky ? "sticky top-0 bg-[rgba(13,17,25,.9)] backdrop-blur-sm" : "relative bg-bg-panel"
      }`}
      style={{ height: TERMINAL_BAR_HEIGHT }}
    >
      {dot("bg-red")}
      {dot("bg-yellow")}
      {dot("bg-green")}
      <span className="ml-2.5 min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-faint sm:flex-initial">
        jaeah@ruthgyeul <span className="text-fainter">—</span> ~/portfolio{" "}
        <span className="text-fainter">—</span> zsh
      </span>
      {branch && (
        <span className="ml-auto hidden shrink-0 items-center gap-1.5 text-xs text-faint sm:flex">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
