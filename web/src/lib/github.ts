/**
 * Pure GitHub data helpers — no network, no framework imports.
 *
 * The fragile part of the live-GitHub integration is parsing GitHub's
 * contribution-calendar HTML (GitHub can change that markup at any time) and
 * arranging it into the grid the UI draws. Keeping that logic here, free of any
 * I/O, lets `/api/github` stay a thin fetch layer and lets these functions be
 * unit-tested against fixed HTML fixtures (see github.test.ts).
 */

export const COLUMNS = 26; // weeks shown in the contribution grid
export const ROWS = 7; // days per week (Sun..Sat)
export const CELLS = COLUMNS * ROWS;
const DAY_MS = 86_400_000;

/** UTC date key (YYYY-MM-DD) for a Date. */
export const dateKey = (d: Date): string => d.toISOString().slice(0, 10);

/** Read a single HTML attribute value out of a tag string. */
export const attr = (tag: string, name: string): string | null => {
  const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
  return m ? m[1] : null;
};

export interface ParsedContributions {
  /** date (YYYY-MM-DD) → heat level 0..4 */
  levelByDate: Map<string, number>;
  /** date (YYYY-MM-DD) → exact contribution count */
  countByDate: Map<string, number>;
}

/**
 * Parse GitHub's `/users/<user>/contributions` HTML fragment. Each day is a
 * `<td>` carrying `data-date` and `data-level`, tied by `id` to an accessible
 * `<tool-tip>` that spells out the exact count ("No contributions on ..." or
 * "N contributions on ...").
 */
export function parseContributionsHtml(html: string): ParsedContributions {
  const levelByDate = new Map<string, number>();
  const countByDate = new Map<string, number>();
  const idToDate = new Map<string, string>();

  const tdRe = /<td\b[^>]*\bdata-date="[^"]*"[^>]*>/g;
  for (const [tag] of html.matchAll(tdRe)) {
    const date = attr(tag, "data-date");
    if (!date) continue;
    const level = Number(attr(tag, "data-level") ?? "0");
    levelByDate.set(date, Number.isFinite(level) ? level : 0);
    const id = attr(tag, "id");
    if (id) idToDate.set(id, date);
  }

  const tipRe = /<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g;
  for (const [, forId, text] of html.matchAll(tipRe)) {
    const date = idToDate.get(forId);
    if (!date) continue;
    const num = text.trim().match(/^([\d,]+)\s+contribution/i);
    countByDate.set(date, num ? Number(num[1].replace(/,/g, "")) : 0);
  }

  return { levelByDate, countByDate };
}

export interface Grid {
  /** Heat levels (0..4), row-major (row = weekday, 26 columns). */
  cells: number[];
  /** Exact counts aligned to `cells`. */
  counts: number[];
  /** ISO date per cell aligned to `cells`; "" for future/blank cells. */
  dates: string[];
  /** Month number labels aligned to the 26 columns ("" when unchanged). */
  monthLabels: string[];
  /** Sum of counts within the visible 26-week window. */
  windowTotal: number;
}

/**
 * Arrange the per-day maps into the grid the UI draws: 26 columns (weeks,
 * Sunday-aligned, newest on the right) × 7 rows (weekday), flattened row-major.
 * `now` is injected so the arrangement is deterministic and testable.
 */
export function buildGrid(
  levelByDate: Map<string, number>,
  countByDate: Map<string, number>,
  now: Date,
): Grid {
  const today = new Date(`${dateKey(now)}T00:00:00Z`);
  const currentWeekSunday = new Date(today.getTime() - today.getUTCDay() * DAY_MS);

  const cells = new Array<number>(CELLS).fill(0);
  const counts = new Array<number>(CELLS).fill(0);
  const dates = new Array<string>(CELLS).fill("");
  const monthLabels = new Array<string>(COLUMNS).fill("");
  const todayKey = dateKey(today);
  let windowTotal = 0;
  let lastMonth = -1;

  for (let col = 0; col < COLUMNS; col++) {
    const weeksAgo = COLUMNS - 1 - col;
    const columnSunday = new Date(currentWeekSunday.getTime() - weeksAgo * 7 * DAY_MS);

    const month = columnSunday.getUTCMonth();
    monthLabels[col] = month !== lastMonth ? String(month + 1) : "";
    lastMonth = month;

    for (let row = 0; row < ROWS; row++) {
      const key = dateKey(new Date(columnSunday.getTime() + row * DAY_MS));
      if (key > todayKey) continue; // future days stay blank
      const idx = row * COLUMNS + col;
      const count = countByDate.get(key) ?? 0;
      cells[idx] = levelByDate.get(key) ?? 0;
      counts[idx] = count;
      dates[idx] = key;
      windowTotal += count;
    }
  }

  return { cells, counts, dates, monthLabels, windowTotal };
}

export interface LangSlice {
  name: string;
  count: number;
  pct: number; // 0..100, rounded to 1 decimal
}

/**
 * Aggregate a repo language distribution by primary language, most-used first.
 * Anything past `limit` distinct languages is folded into an "Other" slice so
 * the bar always sums to 100%.
 */
export function aggregateLanguages(languages: Array<string | null>, limit = 6): LangSlice[] {
  const byLang = new Map<string, number>();
  let total = 0;
  for (const lang of languages) {
    if (!lang) continue;
    byLang.set(lang, (byLang.get(lang) ?? 0) + 1);
    total++;
  }
  if (total === 0) return [];

  const sorted = [...byLang.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const top = sorted.slice(0, limit);
  const otherCount = sorted.slice(limit).reduce((sum, [, c]) => sum + c, 0);

  const round1 = (n: number) => Math.round(n * 10) / 10;
  const slices: LangSlice[] = top.map(([name, count]) => ({
    name,
    count,
    pct: round1((count / total) * 100),
  }));
  if (otherCount > 0) {
    slices.push({ name: "Other", count: otherCount, pct: round1((otherCount / total) * 100) });
  }
  return slices;
}
