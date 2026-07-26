import { describe, expect, it } from "vitest";
import {
  aggregateLanguages,
  attr,
  buildGrid,
  CELLS,
  COLUMNS,
  parseContributionsHtml,
} from "./github";

/** Build one GitHub-style contribution <td> with its paired <tool-tip>. */
const dayCell = (id: string, date: string, level: number, tipText: string): string =>
  `<td data-date="${date}" data-level="${level}" id="${id}" class="ContributionCalendar-day"></td>` +
  `<tool-tip for="${id}" class="sr-only">${tipText}</tool-tip>`;

describe("attr", () => {
  it("reads a named attribute, or null when absent", () => {
    const tag = `<td data-date="2026-07-10" data-level="3" id="c-1">`;
    expect(attr(tag, "data-date")).toBe("2026-07-10");
    expect(attr(tag, "data-level")).toBe("3");
    expect(attr(tag, "missing")).toBeNull();
  });
});

describe("parseContributionsHtml", () => {
  it("extracts levels and exact counts, keyed by date", () => {
    const html = [
      dayCell("c-0", "2026-07-08", 0, "No contributions on July 8th."),
      dayCell("c-1", "2026-07-09", 2, "3 contributions on July 9th."),
      dayCell("c-2", "2026-07-10", 4, "12 contributions on July 10th."),
    ].join("");

    const { levelByDate, countByDate } = parseContributionsHtml(html);

    expect(levelByDate.get("2026-07-08")).toBe(0);
    expect(levelByDate.get("2026-07-09")).toBe(2);
    expect(levelByDate.get("2026-07-10")).toBe(4);

    expect(countByDate.get("2026-07-08")).toBe(0); // "No contributions" → 0
    expect(countByDate.get("2026-07-09")).toBe(3);
    expect(countByDate.get("2026-07-10")).toBe(12);
  });

  it("parses comma-separated counts", () => {
    const html = dayCell("c-0", "2026-01-01", 4, "1,234 contributions on January 1st.");
    const { countByDate } = parseContributionsHtml(html);
    expect(countByDate.get("2026-01-01")).toBe(1234);
  });

  it("returns empty maps for markup with no day cells", () => {
    const { levelByDate, countByDate } = parseContributionsHtml("<div>nothing here</div>");
    expect(levelByDate.size).toBe(0);
    expect(countByDate.size).toBe(0);
  });
});

describe("buildGrid", () => {
  // A Friday, so we can reason about the current (rightmost) week precisely.
  const now = new Date("2026-07-10T12:00:00Z"); // 2026-07-10 is a Friday

  it("produces a full 7×26 grid with aligned counts and dates", () => {
    const grid = buildGrid(new Map(), new Map(), now);
    expect(grid.cells).toHaveLength(CELLS);
    expect(grid.counts).toHaveLength(CELLS);
    expect(grid.dates).toHaveLength(CELLS);
    expect(grid.monthLabels).toHaveLength(COLUMNS);
  });

  it("places a day's level/count at (weekday row, last column)", () => {
    // 2026-07-10 is a Friday → row 5, and it's in the current week → last column.
    const level = new Map([["2026-07-10", 4]]);
    const count = new Map([["2026-07-10", 9]]);
    const grid = buildGrid(level, count, now);

    const idx = 5 * COLUMNS + (COLUMNS - 1); // row 5 (Fri), rightmost column
    expect(grid.cells[idx]).toBe(4);
    expect(grid.counts[idx]).toBe(9);
    expect(grid.dates[idx]).toBe("2026-07-10");
    expect(grid.windowTotal).toBe(9);
  });

  it("leaves future days of the current week blank", () => {
    const grid = buildGrid(new Map(), new Map(), now);
    // Saturday 2026-07-11 is after "now" (Friday) → row 6, last column, blank.
    const future = 6 * COLUMNS + (COLUMNS - 1);
    expect(grid.dates[future]).toBe("");
    expect(grid.cells[future]).toBe(0);
    // Friday (today) in the same column is filled.
    expect(grid.dates[5 * COLUMNS + (COLUMNS - 1)]).toBe("2026-07-10");
  });

  it("ignores dates outside the visible window in windowTotal", () => {
    const count = new Map([
      ["2026-07-10", 5], // inside window
      ["2000-01-01", 99], // far outside
    ]);
    const grid = buildGrid(new Map(), count, now);
    expect(grid.windowTotal).toBe(5);
  });
});

describe("aggregateLanguages", () => {
  it("ranks languages by count and computes percentages", () => {
    const langs = ["TypeScript", "TypeScript", "TypeScript", "Python", null];
    const result = aggregateLanguages(langs);
    // 4 with a language (null skipped): TS 3/4, Python 1/4.
    expect(result).toEqual([
      { name: "TypeScript", count: 3, pct: 75 },
      { name: "Python", count: 1, pct: 25 },
    ]);
  });

  it("folds languages past the limit into an 'Other' slice", () => {
    const langs = ["A", "B", "C", "D"];
    const result = aggregateLanguages(langs, 2);
    expect(result.map((s) => s.name)).toEqual(["A", "B", "Other"]);
    expect(result.find((s) => s.name === "Other")?.count).toBe(2);
    // Percentages sum to 100.
    expect(result.reduce((sum, s) => sum + s.pct, 0)).toBeCloseTo(100, 5);
  });

  it("returns an empty array when there are no languages", () => {
    expect(aggregateLanguages([null, null])).toEqual([]);
    expect(aggregateLanguages([])).toEqual([]);
  });
});
