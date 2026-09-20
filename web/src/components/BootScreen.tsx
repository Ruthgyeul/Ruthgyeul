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
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-bg transition-opacity duration-[400ms] ease-out ${
        fading ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
      }`}
    >
      <div className="w-[280px] text-[13px] leading-[2.1] text-muted">
        {lines.map((line, i) => (
          <div key={i}>
            <span className="text-green">$</span> {line}
          </div>
        ))}
        <span className="text-green [animation:pulse_1s_step-end_infinite]">▌</span>
        <div className="mt-3.5 h-[3px] overflow-hidden rounded-sm bg-white/8">
          <div
            className="h-full bg-gradient-to-r from-accent to-green transition-[width] duration-[350ms] ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-1.5 text-[11px] text-faint">{progressPct}%</div>
      </div>
    </div>
  );
}
