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

/** GitHub's canonical per-language dot colors (subset we actually ship). */
export const langColor: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572a5",
  Java: "#b07219",
  HTML: "#e34c26",
  CSS: "#563d7c",
  C: "#555555",
  "C++": "#f34b7d",
  Solidity: "#aa6746",
  Shell: "#89e051",
  Go: "#00add8",
  Rust: "#dea584",
  Dockerfile: "#384d54",
  Vue: "#41b883",
  Svelte: "#ff3e00",
};

/** Dot color for a repo language, with a neutral fallback for unknowns. */
export const languageColor = (lang: string | null): string =>
  (lang && langColor[lang]) || "#8b93a7";
