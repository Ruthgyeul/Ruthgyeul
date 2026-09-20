"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BootScreen } from "@/components/BootScreen";
import { CommandPalette, type PaletteItem } from "@/components/CommandPalette";
import { TerminalBar } from "@/components/TerminalBar";
import { TERMINAL_BAR_HEIGHT } from "@/lib/layout";
import { contribShades, languageColor } from "@/lib/theme";
import {
  awards,
  bio,
  bootLines,
  contribTitle,
  education,
  experience,
  identity,
  labels,
  learning,
  links,
  mainSkills,
  relativeTime,
  statusLine,
  t,
  tools,
  weekdayShort,
  whoami,
  type Lang,
} from "@/lib/content";

const LANG_KEY = "portfolio-lang-dash";
const TYPE_SPEED_MS = 22;
const BOOT_STEP_MS = 400;

/** Shape returned by the /api/github route (see src/app/api/github/route.ts). */
interface GithubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
  pushedAt: string;
  archived: boolean;
}

interface GithubActivity {
  repo: string;
  branch: string;
  message: string;
  date: string;
  url: string;
}

interface GithubLang {
  name: string;
  count: number;
  pct: number;
}

interface GithubData {
  ok: boolean;
  cells: number[];
  counts: number[];
  dates: string[];
  monthLabels: string[];
  totalLastYear: number;
  windowTotal: number;
  publicRepos: number | null;
  followers: number | null;
  totalStars: number;
  currentStreak: number;
  longestStreak: number;
  repos: GithubRepo[];
  languages: GithubLang[];
  recent: GithubActivity[];
  updatedAt: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Animate an integer from 0 up to `target` once, on mount. Honors
 * prefers-reduced-motion (jumps straight to the value). setState only ever
 * happens inside rAF / a microtask, never synchronously in the effect body.
 */
function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target <= 0) {
      queueMicrotask(() => setValue(target));
      return;
    }
    let raf = 0;
    let startTs = 0;
    const step = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min(1, (ts - startTs) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/** Renders a number that counts up to `value` when it first appears. */
function CountUp({ value }: { value: number }) {
  return <>{useCountUp(value)}</>;
}

export default function Home() {
  // Language: start with a deterministic default for SSR, then reconcile with
  // the visitor's saved/browser preference after mount to avoid hydration drift.
  const [lang, setLang] = useState<Lang>("en");

  const [now, setNow] = useState<Date | null>(null);
  const [typedLen, setTypedLen] = useState(0);

  const [bootStep, setBootStep] = useState(0);
  const [bootFading, setBootFading] = useState(false);
  const [showBoot, setShowBoot] = useState(true);

  const [scrolled, setScrolled] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [spotlight, setSpotlight] = useState<{ x: number; y: number } | null>(null);
  const rafPending = useRef(false);

  const [showAvailTip, setShowAvailTip] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");

  const [github, setGithub] = useState<GithubData | null>(null);
  const [ghStatus, setGhStatus] = useState<"loading" | "ready" | "error">("loading");

  const isKo = lang === "ko";
  const L = useCallback((text: { ko: string; en: string }) => text[lang], [lang]);

  // --- Mount: resolve language preference ------------------------------------
  // The store update is queued as a microtask so it lands after the effect
  // (never synchronously in the effect body), which keeps the initial paint in
  // sync with the server-rendered "en" default before reconciling.
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem(LANG_KEY);
        if (saved === "ko" || saved === "en") setLang(saved);
        else if ((navigator.language || "").toLowerCase().startsWith("ko")) setLang("ko");
      } catch {
        /* localStorage unavailable — keep default */
      }
    });
  }, []);

  // --- Live GitHub data (proxied server-side; see /api/github) ---------------
  useEffect(() => {
    let alive = true;
    fetch("/api/github")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: GithubData | null) => {
        if (!alive) return;
        if (d && d.ok && d.cells.length === 182) {
          setGithub(d);
          setGhStatus("ready");
        } else {
          setGhStatus("error"); // upstream returned, but not usable
        }
      })
      .catch(() => {
        // offline / upstream down — fall back to the generated grid
        if (alive) setGhStatus("error");
      });
    return () => {
      alive = false;
    };
  }, []);

  // --- Clock -----------------------------------------------------------------
  useEffect(() => {
    queueMicrotask(() => setNow(new Date())); // first tick off the sync effect path
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // --- Typing animation (restarts when language changes) ---------------------
  useEffect(() => {
    queueMicrotask(() => setTypedLen(0)); // reset off the sync effect path
    const full = whoami[lang];
    const id = setInterval(() => {
      setTypedLen((prev) => {
        if (prev >= full.length) return prev;
        return prev + 1;
      });
    }, TYPE_SPEED_MS);
    return () => clearInterval(id);
  }, [lang]);

  // --- Boot sequence ---------------------------------------------------------
  useEffect(() => {
    const total = bootLines[lang].length;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < total; i++) {
      timers.push(setTimeout(() => setBootStep(i + 1), BOOT_STEP_MS * (i + 1)));
    }
    timers.push(setTimeout(() => setBootFading(true), BOOT_STEP_MS * total + 500));
    timers.push(setTimeout(() => setShowBoot(false), BOOT_STEP_MS * total + 900));
    return () => timers.forEach(clearTimeout);
    // Boot runs once; language is read at mount time only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Scroll progress + shrinking header ------------------------------------
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // --- Spotlight follows the cursor (rAF-throttled) --------------------------
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    if (!rafPending.current) {
      rafPending.current = true;
      requestAnimationFrame(() => {
        rafPending.current = false;
        setSpotlight({ x, y });
      });
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === "ko" ? "en" : "ko";
      try {
        localStorage.setItem(LANG_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // --- Keyboard: ⌘K / Ctrl-K palette, ⇧L language, ESC close -----------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        setPaletteQuery("");
      } else if (e.key === "Escape" && paletteOpen) {
        setPaletteOpen(false);
      } else if (
        e.shiftKey &&
        e.key.toLowerCase() === "l" &&
        !(e.target instanceof HTMLInputElement)
      ) {
        toggleLang();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, toggleLang]);

  const scrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setPaletteOpen(false);
  }, []);

  // --- Derived / memoized rendering data -------------------------------------
  const clock = now ? `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` : "";
  const dateStr = now
    ? `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`
    : "";

  // Live contribution heat when the API has answered; otherwise a deterministic
  // placeholder grid so the card is never empty (offline, first paint, etc.).
  const contribCells = useMemo(() => {
    if (github) {
      return github.cells.map((level) => contribShades[level] ?? contribShades[0]);
    }
    return Array.from({ length: 182 }, (_, i) => {
      const level = (((i * 7) % 11) + (i % 5) * 2) % 5;
      return contribShades[level];
    });
  }, [github]);

  const { weekdayLabels, monthLabels } = useMemo(() => {
    const base = now ?? new Date(0);
    const days = weekdayShort[lang];
    const weekdayLabels = [0, 1, 2, 3, 4, 5, 6].map((r) =>
      r === 1 || r === 3 || r === 5 ? days[r] : "",
    );
    if (github && github.monthLabels.length === 26) {
      return { weekdayLabels, monthLabels: github.monthLabels };
    }
    const monthLabels: string[] = [];
    let lastMonth = -1;
    for (let col = 0; col < 26; col++) {
      const weeksAgo = 25 - col;
      const dt = new Date(base.getTime() - weeksAgo * 7 * 86_400_000);
      const m = dt.getMonth();
      monthLabels.push(m !== lastMonth ? String(m + 1) : "");
      lastMonth = m;
    }
    return { weekdayLabels, monthLabels };
  }, [now, lang, github]);

  const paletteItems: PaletteItem[] = useMemo(() => {
    const all: PaletteItem[] = [
      { label: L({ ko: "스킬로 이동", en: "Go to Skills" }), tag: "Nav", run: () => scrollToId("sec-skills") },
      { label: L({ ko: "학력으로 이동", en: "Go to Education" }), tag: "Nav", run: () => scrollToId("sec-education") },
      { label: L({ ko: "경력으로 이동", en: "Go to Experience" }), tag: "Nav", run: () => scrollToId("sec-experience") },
      { label: L({ ko: "저장소로 이동", en: "Go to Repositories" }), tag: "Nav", run: () => scrollToId("sec-repos") },
      { label: L({ ko: "수상 로그로 이동", en: "Go to Awards" }), tag: "Nav", run: () => scrollToId("sec-awards") },
      { label: L({ ko: "연락처로 이동", en: "Go to Contact" }), tag: "Nav", run: () => scrollToId("sec-contact") },
      { label: L(labels.toggleLang), tag: "Action", run: () => { toggleLang(); setPaletteOpen(false); } },
      { label: "GitHub — Ruthgyeul", tag: "Link", run: () => window.open(links.github, "_blank", "noopener,noreferrer") },
      { label: "LinkedIn — leejaeah", tag: "Link", run: () => window.open(links.linkedin, "_blank", "noopener,noreferrer") },
      { label: "Instagram — jae.__.ah", tag: "Link", run: () => window.open(links.instagram, "_blank", "noopener,noreferrer") },
    ];
    const q = paletteQuery.toLowerCase();
    return all.filter((item) => item.label.toLowerCase().includes(q));
  }, [L, paletteQuery, scrollToId, toggleLang]);

  const spotlightBg = `radial-gradient(650px circle at ${spotlight ? `${spotlight.x}px` : "50%"} ${
    spotlight ? `${spotlight.y}px` : "0%"
  }, rgba(56,189,248,.05), transparent 40%)`;

  const bootTotal = bootLines[lang].length;
  const bootProgressPct = Math.round((bootStep / bootTotal) * 100);

  return (
    <>
      {showBoot && (
        <BootScreen
          lines={bootLines[lang].slice(0, bootStep)}
          progressPct={bootProgressPct}
          fading={bootFading}
        />
      )}

      {/* Scroll progress bar */}
      <div
        className="fixed left-0 top-0 z-[101] h-0.5 bg-gradient-to-r from-accent to-green transition-[width] duration-100 ease-linear"
        style={{ width: `${scrollPct}%` }}
      />

      {paletteOpen && (
        <CommandPalette
          query={paletteQuery}
          placeholder={L(labels.palettePlaceholder)}
          items={paletteItems}
          onQueryChange={setPaletteQuery}
          onClose={() => setPaletteOpen(false)}
        />
      )}

      <div
        onMouseMove={onMouseMove}
        className="relative min-h-screen bg-bg"
        style={{
          backgroundImage:
            "radial-gradient(1200px 600px at 15% -10%, rgba(56,189,248,.06), transparent), repeating-linear-gradient(0deg, rgba(255,255,255,.012) 0px, rgba(255,255,255,.012) 1px, transparent 1px, transparent 24px)",
        }}
      >
        <div className="pointer-events-none fixed inset-0 z-0" style={{ background: spotlightBg }} />

        <TerminalBar sticky branch="main" />

        <div className="relative z-[1] mx-auto max-w-[1440px] px-4 pb-16 pt-5 sm:px-7">
          {/* Sticky identity header */}
          <header
            className={`sticky z-[19] -mx-0.5 flex flex-wrap items-center gap-3 bg-[rgba(10,13,19,.92)] backdrop-blur-[6px] transition-[padding] duration-150 ease-in-out ${
              scrolled ? "py-1.5" : "py-3.5"
            }`}
            style={{ top: TERMINAL_BAR_HEIGHT }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-accent">
              <rect x="3" y="4" width="18" height="6" rx="1.2" />
              <rect x="3" y="14" width="18" height="6" rx="1.2" />
              <circle cx="7" cy="7" r="0.6" fill="currentColor" />
              <circle cx="7" cy="17" r="0.6" fill="currentColor" />
            </svg>
            <span className="text-[19px] font-semibold tracking-[.02em]">JAEAH LEE</span>
            <LiveDot />
            <span className="relative">
              <button
                onClick={() => setShowAvailTip((s) => !s)}
                className="flex min-h-11 cursor-pointer items-center border-none bg-transparent p-0 font-[inherit] text-xs uppercase tracking-[.08em] text-green"
              >
                {L(labels.available)}
              </button>
              {showAvailTip && (
                <div className="absolute left-0 top-[22px] z-30 whitespace-nowrap rounded-md border border-border-subtle bg-card px-3 py-2.5 text-[11.5px] normal-case tracking-normal text-text-dim shadow-[0_8px_24px_rgba(0,0,0,.4)]">
                  {L(labels.availTip)}
                </div>
              )}
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-4.5 text-xs text-muted">
              <span>
                <span className="text-green">●</span> Live · {clock}
                <span className="text-green [animation:pulse_1s_step-end_infinite]">▌</span>
              </span>
              <span>{L(labels.fullStack)}</span>
              <span>{L(labels.university)}</span>
              <span>{dateStr}</span>
              <button
                onClick={toggleLang}
                className="hover-accent flex min-h-11 cursor-pointer items-center gap-1.5 rounded border border-border-interactive bg-transparent px-2.5 text-[11px] tracking-[.04em] text-text"
              >
                {isKo ? "EN" : "KO"}
                <span className="rounded-[3px] border border-border-pill px-1 py-px text-[9px] text-faint">
                  ⇧L
                </span>
              </button>
              <button
                onClick={() => { setPaletteOpen(true); setPaletteQuery(""); }}
                aria-label={L(labels.palettePlaceholder)}
                className="hover-accent flex min-h-11 cursor-pointer items-center gap-1.5 rounded border border-border-interactive bg-transparent px-2.5 text-[11px] tracking-[.04em] text-muted"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:hidden">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <span className="hidden sm:inline">⌘K</span>
              </button>
            </div>
          </header>

          {/* Status line */}
          <div className="mb-5 flex items-center gap-2 border-y border-border px-0.5 py-2.5 text-[13px] text-green">
            <span>✓</span>
            <span>{L(statusLine)}</span>
          </div>

          {/* whoami */}
          <div className="mb-4 flex flex-wrap gap-x-2.5 gap-y-1.5 text-[13px] text-muted">
            <span className="text-green">jaeah@ruthgyeul</span>
            <span className="text-faint">:~$</span>
            <span className="text-text">whoami</span>
          </div>
          <div className="-mt-2 mb-5 pl-0.5 text-[13px] leading-[1.6] text-text-dim">
            → {whoami[lang].slice(0, typedLen)}
            <span className="text-green [animation:pulse_.9s_step-end_infinite]">▌</span>
          </div>

          {/* Dashboard grid */}
          <div className="dash-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:grid-flow-row-dense">
            {/* Profile card */}
            <Card delay={0} className="flex flex-col gap-4 p-5.5 sm:col-span-2 lg:col-span-5 lg:row-span-2">
              <div className="flex items-center gap-4">
                <div
                  aria-hidden
                  className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-gradient-to-br from-accent to-green text-xl font-bold text-bg"
                >
                  JL
                </div>
                <div>
                  <div className="text-[22px] font-bold">
                    {identity.nameKo}{" "}
                    <span className="font-normal text-muted">/ {identity.nameEn}</span>
                  </div>
                  <div className="mt-1 text-xs text-link">
                    {identity.githubPath}
                    <span className="text-text">{identity.githubHandle}</span>
                  </div>
                </div>
              </div>
              <p className="m-0 text-sm leading-[1.75] text-text-dim">{L(bio)}</p>
              <CodeBlock />
              <div className="mt-auto flex gap-2">
                <SocialButton href={links.github} label="GITHUB" />
                <SocialButton href={links.linkedin} label="LINKEDIN" />
                <SocialButton href={links.instagram} label="INSTAGRAM" />
              </div>
            </Card>

            {/* Main stack */}
            <Card id="sec-skills" delay={0.05} className="lg:col-span-4">
              <SectionLabel className="mb-3.5">{L(labels.mainStack)}</SectionLabel>
              <TagRow items={mainSkills} />
            </Card>

            {/* Tools */}
            <Card delay={0.1} className="lg:col-span-3">
              <SectionLabel className="mb-3.5">{L(labels.tools)}</SectionLabel>
              <TagRow items={tools} />
            </Card>

            {/* Learning */}
            <Card delay={0.15} className="lg:col-span-4">
              <SectionLabel className="mb-3.5">{L(labels.learning)}</SectionLabel>
              <div className="flex flex-wrap gap-1.75">
                {learning.map((item) => (
                  <span
                    key={item}
                    className="rounded border border-dashed border-[rgba(251,191,36,.35)] bg-[rgba(251,191,36,.08)] px-2.25 py-1 text-xs text-yellow"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </Card>

            {/* Awards */}
            <Card id="sec-awards" delay={0.2} className="flex flex-col lg:col-span-3 lg:row-span-3">
              <SectionLabel className="mb-3.5">{L(labels.awards)}</SectionLabel>
              <div className="flex flex-col gap-4 overflow-auto">
                {awards.map((a, i) => (
                  <div key={i} className="border-l-2 pl-2.5" style={{ borderColor: a.color }}>
                    <div className="text-[11px] text-muted">{a.date}</div>
                    <div className="mt-0.75 text-[13px] text-text">{L(a.title)}</div>
                    <div className="mt-0.75 text-xs" style={{ color: a.color }}>{L(a.note)}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* GitHub contributions */}
            <Card delay={0.25} className="lg:col-span-5">
              <div className="mb-3.5 flex items-center justify-between">
                <SectionLabel>GitHub</SectionLabel>
                {github && (
                  <span className="flex items-center gap-1.5 text-[11px] text-green">
                    <LiveDot size={6} />
                    <CountUp value={github.totalLastYear} /> {L(labels.githubContribs)}
                  </span>
                )}
              </div>
              <div className="flex gap-1.25">
                <div
                  aria-hidden
                  className="grid flex-none grid-rows-[repeat(7,1fr)] gap-0.75 pt-3.5 text-right text-[9px] text-faint"
                >
                  {weekdayLabels.map((w, i) => (
                    <div key={i}>{w}</div>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    aria-hidden
                    className="mb-1 grid grid-cols-[repeat(26,1fr)] gap-0.75 whitespace-nowrap text-[9px] text-faint"
                  >
                    {monthLabels.map((m, i) => (
                      <div key={i}>{m}</div>
                    ))}
                  </div>
                  <div
                    role="img"
                    aria-label={
                      github
                        ? `GitHub contribution graph — ${github.totalLastYear} contributions in the last year`
                        : "GitHub contribution graph"
                    }
                    className="grid grid-cols-[repeat(26,1fr)] gap-0.75"
                  >
                    {ghStatus === "loading"
                      ? Array.from({ length: 182 }, (_, i) => (
                          <div
                            key={i}
                            aria-hidden
                            className="aspect-square rounded-sm bg-card-inset [animation:pulse_1.4s_ease-in-out_infinite]"
                            style={{ animationDelay: `${(i % 26) * 0.03}s` }}
                          />
                        ))
                      : contribCells.map((bg, i) => (
                          <div
                            key={i}
                            aria-hidden
                            title={
                              github
                                ? contribTitle(github.dates[i] ?? "", github.counts[i] ?? 0, lang)
                                : L(labels.githubLive)
                            }
                            className="aspect-square rounded-sm"
                            style={{ background: bg }}
                          />
                        ))}
                  </div>
                </div>
              </div>
              {github && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
                  {github.publicRepos !== null && (
                    <span>
                      <b className="font-semibold text-text">
                        <CountUp value={github.publicRepos} />
                      </b>{" "}
                      {L(labels.githubRepos)}
                    </span>
                  )}
                  {github.followers !== null && (
                    <span>
                      <b className="font-semibold text-text">
                        <CountUp value={github.followers} />
                      </b>{" "}
                      {L(labels.githubFollowers)}
                    </span>
                  )}
                  {github.totalStars > 0 && (
                    <span>
                      <b className="font-semibold text-yellow">
                        ★ <CountUp value={github.totalStars} />
                      </b>{" "}
                      {L(labels.totalStars)}
                    </span>
                  )}
                </div>
              )}
              {github && github.longestStreak > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
                  <span>
                    {L(labels.currentStreak)}{" "}
                    <b className="font-semibold text-green">
                      <CountUp value={github.currentStreak} />
                    </b>{" "}
                    {L(labels.days)}
                  </span>
                  <span>
                    {L(labels.longestStreak)}{" "}
                    <b className="font-semibold text-text">
                      <CountUp value={github.longestStreak} />
                    </b>{" "}
                    {L(labels.days)}
                  </span>
                </div>
              )}
              <div className="mt-2.5 text-xs leading-[1.6] text-muted">
                {L(labels.githubNote)}{" "}
                <a href={links.github} target="_blank" rel="noopener noreferrer">
                  github.com/Ruthgyeul
                </a>
              </div>
            </Card>

            {/* In progress — real recent commits when available */}
            <Card delay={0.3} className="lg:col-span-4">
              <SectionLabel className="mb-3.5">{L(labels.inProgress)}</SectionLabel>
              {github && github.recent.length > 0 ? (
                <div className="text-[12.5px] leading-[1.7] text-muted">
                  <div>
                    On branch <span className="text-accent-soft">main</span>
                  </div>
                  <div className="mt-1.5 text-text-dim">{L(labels.recentActivity)}:</div>
                  {github.recent.map((a, i) => (
                    <div key={i} className="mt-2.25">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-green">●</span>
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover-accent text-text no-underline"
                        >
                          {a.repo}
                        </a>
                        <span className="rounded-[3px] border border-border px-[5px] py-px text-[10px] text-faint">
                          {a.branch}
                        </span>
                        <span className="ml-auto text-[11px] text-faint">{a.date}</span>
                      </div>
                      {a.message && (
                        <div
                          className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap pl-3.5 text-muted"
                          title={a.message}
                        >
                          {a.message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[12.5px] leading-[1.95] text-muted">
                  <div>
                    On branch <span className="text-accent-soft">main</span>
                  </div>
                  <div className="mt-1.5 text-text-dim">{L(labels.changes)}</div>
                  <div>
                    <span className="text-yellow">modified:</span> Arbitrum Ambassador{" "}
                    <span className="text-green">(ongoing)</span>
                  </div>
                  <div>
                    <span className="text-yellow">modified:</span> Hyperbolic Ambassador{" "}
                    <span className="text-green">(ongoing)</span>
                  </div>
                  <div>
                    <span className="text-accent">new file:</span> Blockchain Valley 6th{" "}
                    <span className="text-muted">— Senior</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Repositories — live from GitHub */}
            {github && github.repos.length > 0 && (
              <Card id="sec-repos" delay={0.33} className="lg:col-span-12">
                <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
                  <SectionLabel>{L(labels.repositories)}</SectionLabel>
                  <span className="flex items-center gap-1.5 text-[11px] text-green">
                    <LiveDot size={6} />
                    {L(labels.reposLive)}
                  </span>
                </div>
                {github.languages.length > 0 && (
                  <LanguageBar languages={github.languages} label={L(labels.languages)} />
                )}
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-3">
                  {github.repos.map((repo) => (
                    <RepoTile key={repo.name} repo={repo} lang={lang} />
                  ))}
                </div>
              </Card>
            )}

            {/* Experience */}
            <Card id="sec-experience" delay={0.35} className="lg:col-span-9">
              <SectionLabel className="mb-3.5">{L(labels.experience)}</SectionLabel>
              <div className="flex flex-col">
                <div className="hidden border-b border-border pb-2 text-[11px] uppercase tracking-[.05em] text-muted sm:grid sm:grid-cols-[2.4fr_1.6fr_1.4fr]">
                  <span>{L(labels.org)}</span>
                  <span>{L(labels.role)}</span>
                  <span>{L(labels.duration)}</span>
                </div>
                {experience.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 gap-1 border-b border-white/5 py-2.75 text-[13px] sm:grid-cols-[2.4fr_1.6fr_1.4fr] sm:items-center sm:gap-0"
                  >
                    <span>{L(row.org)}</span>
                    <span className="text-text-dim">
                      <span className="text-faint sm:hidden">{L(labels.role)}: </span>
                      {L(row.role)}
                    </span>
                    <span style={{ color: row.color }}>
                      <span className="text-faint sm:hidden">{L(labels.duration)}: </span>
                      {L(row.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Education */}
            <Card id="sec-education" delay={0.4} className="lg:col-span-4">
              <SectionLabel className="mb-3.5">Inha University</SectionLabel>
              <div className="text-sm font-semibold">{L(education.degree.title)}</div>
              <div className="mt-1 text-xs leading-[1.6] text-muted">{L(education.degree.note)}</div>
              <TagRow items={education.degree.tags} small className="mt-2.5" />
            </Card>

            {/* Blockchain Valley */}
            <Card delay={0.45} className="lg:col-span-5">
              <SectionLabel className="mb-3.5">Blockchain Valley 6th</SectionLabel>
              <div className="text-sm font-semibold">{L(education.blockchainValley.title)}</div>
              <div className="mt-1 text-xs leading-[1.6] text-muted">{L(education.blockchainValley.note)}</div>
              <TagRow items={education.blockchainValley.tags} small className="mt-2.5" />
            </Card>

            {/* Contact */}
            <Card
              id="sec-contact"
              delay={0.5}
              className="flex flex-wrap items-center gap-7 px-5 py-3.5 text-xs text-muted lg:col-span-12"
            >
              <span>{L(labels.contact)} —</span>
              <ContactLink href={links.github} label="GitHub · Ruthgyeul" hint="G" />
              <ContactLink href={links.linkedin} label="LinkedIn · leejaeah" hint="L" />
              <ContactLink href={links.instagram} label="Instagram · jae.__.ah" hint="I" />
              <span className="ml-auto">{L(labels.copyright)}</span>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

/* --------------------------------- pieces --------------------------------- */

function Card({
  children,
  className = "",
  id,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  delay?: number;
}) {
  return (
    <div
      id={id}
      className={`card rounded-lg border border-border bg-card p-4.5 [animation:fadeUp_.5s_ease_both] ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

/** Small pulsing "live" indicator dot, shared by the header and the two GitHub-data cards. */
function LiveDot({ size = 8 }: { size?: number }) {
  return (
    <span
      className="shrink-0 rounded-full bg-green [animation:pulse_2s_ease-in-out_infinite]"
      style={{ width: size, height: size }}
    />
  );
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs uppercase tracking-[.06em] text-muted ${className}`}>
      <span className="font-semibold text-faint">{"//"}</span>
      {children}
    </div>
  );
}

function TagRow({
  items,
  small = false,
  className = "",
}: {
  items: readonly string[];
  small?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap ${small ? "gap-1.5" : "gap-1.75"} ${className}`}>
      {items.map((item) => (
        <span
          key={item}
          className={`rounded bg-white/4 text-text-dim ${
            small ? "px-2 py-0.75 text-[11px]" : "px-2.25 py-1 text-xs"
          }`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function LanguageBar({ languages, label }: { languages: GithubLang[]; label: string }) {
  const colorFor = (name: string) => (name === "Other" ? "var(--color-faint)" : languageColor(name));
  return (
    <div className="mb-4">
      <div className="mb-2 text-[11px] uppercase tracking-[.05em] text-muted">{label}</div>
      <div
        role="img"
        aria-label={`${label}: ${languages.map((l) => `${l.name} ${l.pct}%`).join(", ")}`}
        className="flex h-2 w-full overflow-hidden rounded-full bg-card-inset"
      >
        {languages.map((lng) => (
          <div key={lng.name} aria-hidden style={{ width: `${lng.pct}%`, background: colorFor(lng.name) }} />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        {languages.map((lng) => (
          <span key={lng.name} className="flex items-center gap-1.5 text-xs text-text-dim">
            <span className="h-2.25 w-2.25 rounded-full" style={{ background: colorFor(lng.name) }} />
            {lng.name}
            <span className="text-faint">{lng.pct}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function RepoTile({ repo, lang }: { repo: GithubRepo; lang: Lang }) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="repo-tile flex min-h-26 flex-col gap-2 rounded-md border border-border-soft bg-card-inset px-3.5 py-3 no-underline"
    >
      <div className="flex items-center gap-1.75">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden className="text-muted">
          <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.25.25 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
        </svg>
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-text">
          {repo.name}
        </span>
        {repo.archived && (
          <span className="flex-none rounded-[3px] border border-border-soft px-[5px] py-px text-[9.5px] uppercase tracking-[.04em] text-faint">
            {t(labels.archived, lang)}
          </span>
        )}
      </div>
      <div className="clamp-2 flex-1 text-xs leading-[1.5] text-muted">{repo.description || "—"}</div>
      <div className="flex items-center gap-3.5 text-[11.5px] text-faint">
        {repo.language && (
          <span className="flex items-center gap-1.25">
            <span className="h-2.25 w-2.25 rounded-full" style={{ background: languageColor(repo.language) }} />
            {repo.language}
          </span>
        )}
        <span>★ {repo.stars}</span>
        <span className="ml-auto">{relativeTime(repo.pushedAt, lang)}</span>
      </div>
    </a>
  );
}

function SocialButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="hover-accent flex-1 rounded-md border border-border-subtle bg-white/3 p-2.25 text-center text-xs text-text no-underline"
    >
      {label}
    </a>
  );
}

function ContactLink({ href, label, hint }: { href: string; label: string; hint: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="hover-accent flex items-center gap-1.5 text-text no-underline"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-green" />
      {label}
      <span className="rounded-[3px] border border-border-pill px-[5px] py-px text-[10px] text-faint">
        {hint}
      </span>
    </a>
  );
}

function CodeBlock() {
  return (
    <div className="flex gap-3 overflow-x-auto rounded-md border border-border-soft bg-card-inset px-3.5 py-3 text-[12.5px] leading-[1.8]">
      <div className="select-none text-right text-gutter">
        1<br />2<br />3<br />4<br />5
      </div>
      <div className="whitespace-pre">
        <div>
          <span className="text-muted">const</span>{" "}
          <span className="text-accent-soft">profile</span>{" "}
          <span className="text-muted">=</span> {"{"}
        </div>
        <div className="pl-4">
          <span className="text-pink">role</span>:{" "}
          <span className="text-lime">&apos;Full-Stack Developer&apos;</span>,
        </div>
        <div className="pl-4">
          <span className="text-pink">focus</span>: [
          <span className="text-lime">&apos;web3&apos;</span>,{" "}
          <span className="text-lime">&apos;blockchain&apos;</span>,{" "}
          <span className="text-lime">&apos;cloud&apos;</span>],
        </div>
        <div className="pl-4">
          <span className="text-pink">status</span>:{" "}
          <span className="text-yellow">&apos;available&apos;</span>
        </div>
        <div>
          {"}"}
          <span className="text-green [animation:pulse_.9s_step-end_infinite]">▌</span>
        </div>
      </div>
    </div>
  );
}
