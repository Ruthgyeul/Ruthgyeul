import { color } from "@/lib/theme";

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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(4,6,10,.7)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "14vh",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          maxWidth: "90vw",
          background: color.card,
          border: `1px solid rgba(255,255,255,.12)`,
          borderRadius: 10,
          boxShadow: "0 24px 60px rgba(0,0,0,.5)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderBottom: `1px solid ${color.border}`,
          }}
        >
          <span style={{ color: color.faint }}>$</span>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            autoFocus
            placeholder={placeholder}
            aria-label={placeholder}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: color.text,
              fontFamily: "inherit",
              fontSize: 14,
            }}
          />
          <span
            style={{
              fontSize: 10,
              color: color.faint,
              border: `1px solid rgba(255,255,255,.12)`,
              borderRadius: 3,
              padding: "1px 5px",
            }}
          >
            ESC
          </span>
        </div>
        <div style={{ maxHeight: 320, overflow: "auto", padding: 6 }}>
          {items.map((item, i) => (
            <button
              key={i}
              onClick={item.run}
              className="hover-soft"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                width: "100%",
                textAlign: "left",
                background: "transparent",
                border: "none",
                color: color.text,
                fontFamily: "inherit",
                fontSize: 13,
                padding: "10px 12px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              <span>{item.label}</span>
              <span style={{ fontSize: 10, color: color.faint }}>{item.tag}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
