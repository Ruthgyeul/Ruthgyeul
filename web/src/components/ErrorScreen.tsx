import type { ReactNode } from "react";
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
    <div className="flex min-h-screen flex-col bg-bg">
      <TerminalBar />
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[520px]">
          <div className="mb-1.5 text-[13px] text-muted">
            jaeah@ruthgyeul<span className="text-faint">:~$</span> {command}
          </div>
          <div className="my-[18px] text-5xl font-bold leading-none sm:text-[64px]" style={{ color: codeColor }}>
            {code}
          </div>
          <div className="mb-[18px] text-[15px] text-text-dim">{message}</div>
          <div className="rounded-lg border border-border bg-card px-[18px] py-4 text-[12.5px] leading-[1.8] text-muted">
            {details.map((d) => (
              <div key={d.key}>
                <span className="text-pink">{d.key}</span>:{" "}
                <span style={{ color: d.valueColor }} className={d.valueColor ? "" : "text-lime"}>
                  {d.value}
                </span>
              </div>
            ))}
          </div>
          {/* Plain anchor on purpose: a full reload cleanly resets error state. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="mt-[22px] inline-flex min-h-11 items-center rounded-md border border-border-overlay bg-white/3 px-4 text-[13px] text-text no-underline"
          >
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
