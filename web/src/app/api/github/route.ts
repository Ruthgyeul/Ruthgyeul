import { NextResponse } from "next/server";
import { identity } from "@/lib/content";
import {
  aggregateLanguages,
  buildGrid,
  parseContributionsHtml,
  type LangSlice,
} from "@/lib/github";

/**
 * Real GitHub data, proxied server-side.
 *
 * The page's Content-Security-Policy is `connect-src 'self'`, so the browser
 * cannot call GitHub directly. This route runs on our own Node server, fetches
 * the live data first-party from GitHub, and hands the browser a small, shaped
 * JSON payload from the same origin.
 *
 * All parsing / grid-building / language aggregation lives in `@/lib/github`
 * (pure, unit-tested). This file is just the fetch + caching layer.
 *
 * Two first-party, token-free upstreams:
 *   - Contribution calendar: GitHub's own `/users/<user>/contributions`
 *     fragment (the HTML the profile page renders). GitHub does not expose the
 *     calendar via REST, and GraphQL needs a token — so we parse this fragment.
 *   - Profile stats / repos / commits: GitHub REST API, unauthenticated.
 *
 * Responses are cached for an hour (`revalidate`) so we stay well under the
 * unauthenticated rate limits no matter how much traffic the page gets.
 */

export const revalidate = 3600; // seconds

const REPO_LIMIT = 6;
const RECENT_LIMIT = 3;

const GH_HEADERS = {
  accept: "application/vnd.github+json",
  "user-agent": "ruthgyeul-portfolio",
} as const;

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
  /** Exact contribution counts aligned to `cells`. */
  counts: number[];
  /** ISO date per cell aligned to `cells` ("" for future/blank cells). */
  dates: string[];
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
  /** Primary-language distribution across owned repos. */
  languages: LangSlice[];
  /** Most recently pushed repos with their latest commit — real git activity. */
  recent: RecentActivity[];
  updatedAt: string;
}

async function fetchContributions() {
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
  return parseContributionsHtml(await res.text());
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
 * Owned (non-fork) repos, shaped three ways: the most notable by stars for the
 * repo showcase, a primary-language distribution, and the most recently pushed
 * (with their latest commit) for the live "in progress" activity feed. The
 * special profile repo (named after the account) is skipped.
 */
async function fetchRepos(): Promise<{
  repos: Repo[];
  languages: LangSlice[];
  recent: RecentActivity[];
}> {
  try {
    const res = await fetch(
      `https://api.github.com/users/${identity.githubHandle}/repos?per_page=100&sort=pushed`,
      { next: { revalidate }, headers: GH_HEADERS },
    );
    if (!res.ok) return { repos: [], languages: [], recent: [] };
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

    const languages = aggregateLanguages(owned.map((r) => r.language));

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

    return { repos, languages, recent };
  } catch {
    return { repos: [], languages: [], recent: [] };
  }
}

export async function GET() {
  try {
    const [{ levelByDate, countByDate }, profile, repoData] = await Promise.all([
      fetchContributions(),
      fetchProfile(),
      fetchRepos(),
    ]);
    const { cells, counts, dates, monthLabels, windowTotal } = buildGrid(
      levelByDate,
      countByDate,
      new Date(),
    );
    let totalLastYear = 0;
    for (const c of countByDate.values()) totalLastYear += c;

    const payload: GithubPayload = {
      ok: true,
      cells,
      counts,
      dates,
      monthLabels,
      totalLastYear,
      windowTotal,
      publicRepos: profile.publicRepos,
      followers: profile.followers,
      repos: repoData.repos,
      languages: repoData.languages,
      recent: repoData.recent,
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json(payload);
  } catch {
    // Never break the page — signal failure so the client keeps its fallback.
    const empty: GithubPayload = {
      ok: false,
      cells: [],
      counts: [],
      dates: [],
      monthLabels: [],
      totalLastYear: 0,
      windowTotal: 0,
      publicRepos: null,
      followers: null,
      repos: [],
      languages: [],
      recent: [],
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json(empty, { status: 200 });
  }
}
