export interface PaletteItem {
  label: string;
  tag: string;
  run: () => void;
}

/**
 * ⌘K / Ctrl-K command palette for jumping around the page or firing actions.
 * Rendered only while open; the parent owns the open/query state.
 */
export function CommandPalette({
  query,
  placeholder,
  items,
  onQueryChange,
  onClose,
}: {
  query: string;
  placeholder: string;
  items: PaletteItem[];
  onQueryChange: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-start justify-center bg-[rgba(4,6,10,.7)] pt-[14vh]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={placeholder}
        onClick={(e) => e.stopPropagation()}
        className="w-[520px] max-w-[90vw] overflow-hidden rounded-[10px] border border-border-overlay bg-card shadow-[0_24px_60px_rgba(0,0,0,.5)]"
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <span className="text-faint">$</span>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            autoFocus
            placeholder={placeholder}
            aria-label={placeholder}
            className="flex-1 bg-transparent font-[inherit] text-sm text-text outline-none"
          />
          <span className="rounded-[3px] border border-border-overlay px-[5px] py-px text-[10px] text-faint">
            ESC
          </span>
        </div>
        <div className="max-h-80 overflow-auto p-1.5">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={item.run}
              className="hover-soft flex min-h-11 w-full cursor-pointer items-center justify-between gap-2.5 rounded-md border-none bg-transparent px-3 py-2.5 text-left font-[inherit] text-[13px] text-text"
            >
              <span>{item.label}</span>
              <span className="text-[10px] text-faint">{item.tag}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
