/**
 * Design tokens ported from the approved mockups.
 * Kept in one place so the whole palette can be retuned without hunting
 * through components.
 */
export const color = {
  bg: "#0a0d13",
  bgPanel: "#0d1119",
  card: "#111621",
  cardInset: "#0d1119",
  border: "rgba(255,255,255,.08)",
  borderSoft: "rgba(255,255,255,.06)",
  text: "#e6e8ee",
  textDim: "#c3c8d4",
  muted: "#8b93a7",
  faint: "#5c6478",
  fainter: "#3a4152",
  gutter: "#3a4152",
  accent: "#38bdf8",
  accentSoft: "#7cd4fb",
  link: "#5c9bd8",
  green: "#34d399",
  yellow: "#fbbf24",
  red: "#f87171",
  pink: "#f472b6",
  lime: "#a3e635",
} as const;

/** GitHub contribution-graph heat shades (low → high). */
export const contribShades = [
  "#161b26",
  "#0e4429",
  "#006d32",
  "#26a641",
  "#39d353",
] as const;
