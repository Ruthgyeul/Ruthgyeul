import { NextResponse } from "next/server";
import { identity } from "@/lib/content";

/**
 * Real GitHub data, proxied server-side.
 *
 * The page's Content-Security-Policy is `connect-src 'self'`, so the browser
 * cannot call GitHub directly. This route runs on our own Node server, fetches
 * the live data first-party from GitHub, and hands the browser a small, shaped
 * JSON payload from the same origin.
 *
 * Two first-party, token-free upstreams:
 *   - Contribution calendar: GitHub's own `/users/<user>/contributions`
 *     fragment (the same HTML the profile page renders). GitHub does not expose
 *     the calendar via its public REST API and the GraphQL endpoint needs a
 *     personal token, so we parse this fragment. Each day is a `<td>` carrying
 *     `data-date` and `data-level`, with an accessible `<tool-tip>` giving the
 *     exact count.
 *   - Profile stats (repos / followers): GitHub REST API, unauthenticated.
 *
 * Responses are cached for an hour (`revalidate`) so we stay well under the
 * unauthenticated rate limits no matter how much traffic the page gets.
 */

export const revalidate = 3600; // seconds

const COLUMNS = 26; // weeks shown in the contribution grid
const ROWS = 7; // days per week (Sun..Sat)
const CELLS = COLUMNS * ROWS;
const DAY_MS = 86_400_000;

interface Repo {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
  pushedAt: string;
}

interface RecentActivity {
  repo: string;
  branch: string;
  message: string;
  date: string;
  url: string;
}

interface GithubPayload {
  ok: boolean;
  /** Heat levels (0..4) in row-major order (row = weekday, 26 columns). */
  cells: number[];
  /** Month number labels aligned to the 26 columns ("" when unchanged). */
  monthLabels: string[];
  /** Contributions in the last year (as GitHub reports it). */
  totalLastYear: number;
  /** Contributions within the visible 26-week window. */
  windowTotal: number;
  publicRepos: number | null;
  followers: number | null;
  /** Top owned (non-fork) repositories, most notable first. */
  repos: Repo[];
  /** Most recently pushed repos with their latest commit — real git activity. */
  recent: RecentActivity[];
  updatedAt: string;
}

const REPO_LIMIT = 6;
const RECENT_LIMIT = 3;

const GH_HEADERS = {
  accept: "application/vnd.github+json",
  "user-agent": "ruthgyeul-portfolio",
} as const;

/** UTC date key (YYYY-MM-DD) for a Date. */
const dateKey = (d: Date): string => d.toISOString().slice(0, 10);

const attr = (tag: string, name: string): string | null => {
  const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
  return m ? m[1] : null;
};

/**
 * Parse GitHub's contribution-calendar HTML fragment into per-day levels and
 * exact counts, keyed by ISO date.
 */
async function fetchContributions(): Promise<{
  levelByDate: Map<string, number>;
  countByDate: Map<string, number>;
}> {
  const res = await fetch(
    `https://github.com/users/${identity.githubHandle}/contributions`,
    {
      next: { revalidate },
      headers: {
        "x-requested-with": "XMLHttpRequest",
        "user-agent": "ruthgyeul-portfolio",
        accept: "text/html",
      },
    },
  );
  if (!res.ok) throw new Error(`contributions upstream ${res.status}`);
  const html = await res.text();

  const levelByDate = new Map<string, number>();
  const countByDate = new Map<string, number>();
  const idToDate = new Map<string, string>();

  // Day cells: <td ... data-date="YYYY-MM-DD" ... data-level="N" id="..." ...>
  const tdRe = /<td\b[^>]*\bdata-date="[^"]*"[^>]*>/g;
  for (const [tag] of html.matchAll(tdRe)) {
    const date = attr(tag, "data-date");
    if (!date) continue;
    const level = Number(attr(tag, "data-level") ?? "0");
    levelByDate.set(date, Number.isFinite(level) ? level : 0);
    const id = attr(tag, "id");
    if (id) idToDate.set(id, date);
  }

  // Tooltips carry the exact count: "No contributions on ..." or "N contributions on ...".
  const tipRe = /<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g;
  for (const [, forId, text] of html.matchAll(tipRe)) {
    const date = idToDate.get(forId);
    if (!date) continue;
    const num = text.trim().match(/^([\d,]+)\s+contribution/i);
    countByDate.set(date, num ? Number(num[1].replace(/,/g, "")) : 0);
  }

  return { levelByDate, countByDate };
}

async function fetchProfile(): Promise<{ publicRepos: number | null; followers: number | null }> {
  try {
    const res = await fetch(`https://api.github.com/users/${identity.githubHandle}`, {
      next: { revalidate },
      headers: GH_HEADERS,
    });
    if (!res.ok) return { publicRepos: null, followers: null };
    const json = (await res.json()) as { public_repos?: number; followers?: number };
    return {
      publicRepos: typeof json.public_repos === "number" ? json.public_repos : null,
      followers: typeof json.followers === "number" ? json.followers : null,
    };
  } catch {
    return { publicRepos: null, followers: null };
  }
}

interface RawRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  pushed_at: string;
  fork: boolean;
  default_branch: string;
}

/** The latest commit subject on a repo's default branch (first line only). */
async function fetchLatestCommit(repo: string): Promise<{ message: string; date: string } | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${identity.githubHandle}/${repo}/commits?per_page=1`,
      { next: { revalidate }, headers: GH_HEADERS },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{ commit?: { message?: string; author?: { date?: string } } }>;
    const c = json[0]?.commit;
    if (!c?.message) return null;
    return { message: c.message.split("\n")[0].slice(0, 72), date: (c.author?.date ?? "").slice(0, 10) };
  } catch {
    return null;
  }
}

/**
 * Owned (non-fork) repos, shaped two ways: the most notable by stars for the
 * repo showcase, and the most recently pushed (with their latest commit) for
 * the live "in progress" activity feed. The special profile repo (named after
 * the account) is skipped — it only holds the profile README.
 */
async function fetchRepos(): Promise<{ repos: Repo[]; recent: RecentActivity[] }> {
  try {
    const res = await fetch(
      `https://api.github.com/users/${identity.githubHandle}/repos?per_page=100&sort=pushed`,
      { next: { revalidate }, headers: GH_HEADERS },
    );
    if (!res.ok) return { repos: [], recent: [] };
    const raw = (await res.json()) as RawRepo[];
    const owned = raw.filter((r) => !r.fork && r.name !== identity.githubHandle);

    const repos: Repo[] = [...owned]
      .sort(
        (a, b) =>
          b.stargazers_count - a.stargazers_count ||
          new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime(),
      )
      .slice(0, REPO_LIMIT)
      .map((r) => ({
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        url: r.html_url,
        pushedAt: r.pushed_at,
      }));

    // `owned` is already newest-pushed first (sort=pushed).
    const recentRepos = owned.slice(0, RECENT_LIMIT);
    const commits = await Promise.all(recentRepos.map((r) => fetchLatestCommit(r.name)));
    const recent: RecentActivity[] = recentRepos.map((r, i) => ({
      repo: r.name,
      branch: r.default_branch,
      message: commits[i]?.message ?? "",
      date: commits[i]?.date ?? r.pushed_at.slice(0, 10),
      url: r.html_url,
    }));

    return { repos, recent };
  } catch {
    return { repos: [], recent: [] };
  }
}

/**
 * Arrange the per-day maps into the grid the UI draws: 26 columns (weeks,
 * Sunday-aligned, newest on the right) × 7 rows (weekday), flattened row-major
 * so the client can map index → shade directly.
 */
function buildGrid(
  levelByDate: Map<string, number>,
  countByDate: Map<string, number>,
): { cells: number[]; monthLabels: string[]; windowTotal: number } {
  // Sunday that opens the current (rightmost) week, in UTC.
  const today = new Date(`${dateKey(new Date())}T00:00:00Z`);
  const currentWeekSunday = new Date(today.getTime() - today.getUTCDay() * DAY_MS);

  const cells = new Array<number>(CELLS).fill(0);
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
      if (key > todayKey) continue; // future days stay empty
      cells[row * COLUMNS + col] = levelByDate.get(key) ?? 0;
      windowTotal += countByDate.get(key) ?? 0;
    }
  }

  return { cells, monthLabels, windowTotal };
}

export async function GET() {
  try {
    const [{ levelByDate, countByDate }, profile, repoData] = await Promise.all([
      fetchContributions(),
      fetchProfile(),
      fetchRepos(),
    ]);
    const { cells, monthLabels, windowTotal } = buildGrid(levelByDate, countByDate);
    let totalLastYear = 0;
    for (const c of countByDate.values()) totalLastYear += c;

    const payload: GithubPayload = {
      ok: true,
      cells,
      monthLabels,
      totalLastYear,
      windowTotal,
      publicRepos: profile.publicRepos,
      followers: profile.followers,
      repos: repoData.repos,
      recent: repoData.recent,
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json(payload);
  } catch {
    // Never break the page — signal failure so the client keeps its fallback.
    const empty: GithubPayload = {
      ok: false,
      cells: [],
      monthLabels: [],
      totalLastYear: 0,
      windowTotal: 0,
      publicRepos: null,
      followers: null,
      repos: [],
      recent: [],
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json(empty, { status: 200 });
  }
}
