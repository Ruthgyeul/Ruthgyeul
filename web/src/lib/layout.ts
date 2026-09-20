/**
 * Shared layout constants that multiple components must agree on.
 * TERMINAL_BAR_HEIGHT in particular: TerminalBar renders at this height and
 * the sticky identity header in page.tsx offsets itself by the same amount —
 * keeping both in one place stops them drifting apart independently.
 */
export const TERMINAL_BAR_HEIGHT = 38;
