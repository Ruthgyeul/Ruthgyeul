"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BootScreen } from "@/components/BootScreen";
import { CommandPalette, type PaletteItem } from "@/components/CommandPalette";
import { TerminalBar } from "@/components/TerminalBar";
import { color, contribShades } from "@/lib/theme";
import {
  awards,
  bio,
  bootLines,
  education,
  experience,
  identity,
  labels,
  learning,
  links,
  mainSkills,
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

const pad = (n: number) => String(n).padStart(2, "0");

export default function Home() {
  // Language: start with a deterministic default for SSR, then reconcile with
  // the visitor's saved/browser preference after mount to avoid hydration drift.
  const [lang, setLang] = useState<Lang>("en");
  const [mounted, setMounted] = useState(false);

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

  const isKo = lang === "ko";
  const L = useCallback((text: { ko: string; en: string }) => text[lang], [lang]);

  // --- Mount: resolve language preference ------------------------------------
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "ko" || saved === "en") setLang(saved);
      else if ((navigator.language || "").toLowerCase().startsWith("ko")) setLang("ko");
    } catch {
      /* localStorage unavailable — keep default */
    }
  }, []);

  // --- Clock -----------------------------------------------------------------
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // --- Typing animation (restarts when language changes) ---------------------
  useEffect(() => {
    setTypedLen(0);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteOpen]);

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

  const contribCells = useMemo(
    () =>
      Array.from({ length: 182 }, (_, i) => {
        const level = (((i * 7) % 11) + (i % 5) * 2) % 5;
        return contribShades[level];
      }),
    [],
  );

  const { weekdayLabels, monthLabels } = useMemo(() => {
    const base = now ?? new Date(0);
    const days = weekdayShort[lang];
    const weekdayLabels = [0, 1, 2, 3, 4, 5, 6].map((r) =>
      r === 1 || r === 3 || r === 5 ? days[r] : "",
    );
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
  }, [now, lang]);

  const paletteItems: PaletteItem[] = useMemo(() => {
    const all: PaletteItem[] = [
      { label: L({ ko: "스킬로 이동", en: "Go to Skills" }), tag: "Nav", run: () => scrollToId("sec-skills") },
      { label: L({ ko: "학력으로 이동", en: "Go to Education" }), tag: "Nav", run: () => scrollToId("sec-education") },
      { label: L({ ko: "경력으로 이동", en: "Go to Experience" }), tag: "Nav", run: () => scrollToId("sec-experience") },
      { label: L({ ko: "수상 로그로 이동", en: "Go to Awards" }), tag: "Nav", run: () => scrollToId("sec-awards") },
      { label: L({ ko: "연락처로 이동", en: "Go to Contact" }), tag: "Nav", run: () => scrollToId("sec-contact") },
      { label: L(labels.toggleLang), tag: "Action", run: () => { toggleLang(); setPaletteOpen(false); } },
      { label: "GitHub — Ruthgyeul", tag: "Link", run: () => window.open(links.github, "_blank") },
      { label: "LinkedIn — leejaeah", tag: "Link", run: () => window.open(links.linkedin, "_blank") },
      { label: "Instagram — jae.__.ah", tag: "Link", run: () => window.open(links.instagram, "_blank") },
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
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 2,
          background: "linear-gradient(90deg,#38bdf8,#34d399)",
          width: `${scrollPct}%`,
          zIndex: 101,
          transition: "width .1s linear",
        }}
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
        style={{
          minHeight: "100vh",
          position: "relative",
          background:
            "radial-gradient(1200px 600px at 15% -10%, rgba(56,189,248,.06), transparent), repeating-linear-gradient(0deg, rgba(255,255,255,.012) 0px, rgba(255,255,255,.012) 1px, transparent 1px, transparent 24px), #0a0d13",
        }}
      >
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            background: spotlightBg,
          }}
        />

        <TerminalBar sticky branch="main" />

        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: "20px 28px 64px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Sticky identity header */}
          <header
            style={{
              position: "sticky",
              top: 38,
              zIndex: 19,
              background: "rgba(10,13,19,.92)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: `${scrolled ? "6px" : "14px"} 0`,
              flexWrap: "wrap",
              transition: "padding .15s ease",
              margin: "0 -2px",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color.accent} strokeWidth="1.6">
              <rect x="3" y="4" width="18" height="6" rx="1.2" />
              <rect x="3" y="14" width="18" height="6" rx="1.2" />
              <circle cx="7" cy="7" r="0.6" fill={color.accent} />
              <circle cx="7" cy="17" r="0.6" fill={color.accent} />
            </svg>
            <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: ".02em" }}>JAEAH LEE</span>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: color.green,
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            <span style={{ position: "relative" }}>
              <button
                onClick={() => setShowAvailTip((s) => !s)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontFamily: "inherit",
                  fontSize: 12,
                  color: color.green,
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {L(labels.available)}
              </button>
              {showAvailTip && (
                <div
                  style={{
                    position: "absolute",
                    top: 22,
                    left: 0,
                    background: color.card,
                    border: "1px solid rgba(255,255,255,.1)",
                    borderRadius: 6,
                    padding: "10px 12px",
                    fontSize: 11.5,
                    color: color.textDim,
                    whiteSpace: "nowrap",
                    boxShadow: "0 8px 24px rgba(0,0,0,.4)",
                    zIndex: 30,
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  {L(labels.availTip)}
                </div>
              )}
            </span>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 18,
                fontSize: 12,
                color: color.muted,
                flexWrap: "wrap",
              }}
            >
              <span>
                <span style={{ color: color.green }}>●</span> Live · {clock}
                <span style={{ color: color.green, animation: "pulse 1s step-end infinite" }}>▌</span>
              </span>
              <span>{L(labels.fullStack)}</span>
              <span>{L(labels.university)}</span>
              <span>{dateStr}</span>
              <button
                onClick={toggleLang}
                className="hover-accent"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,.16)",
                  color: color.text,
                  fontFamily: "inherit",
                  fontSize: 11,
                  padding: "5px 10px",
                  borderRadius: 4,
                  cursor: "pointer",
                  letterSpacing: ".04em",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {isKo ? "EN" : "KO"}
                <span
                  style={{
                    fontSize: 9,
                    padding: "1px 4px",
                    border: "1px solid rgba(255,255,255,.15)",
                    borderRadius: 3,
                    color: color.faint,
                  }}
                >
                  ⇧L
                </span>
              </button>
              <button
                onClick={() => { setPaletteOpen(true); setPaletteQuery(""); }}
                className="hover-accent"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,.16)",
                  color: color.muted,
                  fontFamily: "inherit",
                  fontSize: 11,
                  padding: "5px 10px",
                  borderRadius: 4,
                  cursor: "pointer",
                  letterSpacing: ".04em",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                ⌘K
              </button>
            </div>
          </header>

          {/* Status line */}
          <div
            style={{
              borderTop: `1px solid ${color.border}`,
              borderBottom: `1px solid ${color.border}`,
              padding: "10px 2px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: color.green,
            }}
          >
            <span>✓</span>
            <span>{L(statusLine)}</span>
          </div>

          {/* whoami */}
          <div
            style={{
              fontSize: 13,
              color: color.muted,
              marginBottom: 16,
              display: "flex",
              flexWrap: "wrap",
              gap: "6px 10px",
            }}
          >
            <span style={{ color: color.green }}>jaeah@ruthgyeul</span>
            <span style={{ color: color.faint }}>:~$</span>
            <span style={{ color: color.text }}>whoami</span>
          </div>
          <div
            style={{
              fontSize: 13,
              color: color.textDim,
              margin: "-8px 0 20px",
              paddingLeft: 2,
              lineHeight: 1.6,
            }}
          >
            → {whoami[lang].slice(0, typedLen)}
            <span style={{ color: color.green, animation: "pulse .9s step-end infinite" }}>▌</span>
          </div>

          {/* Dashboard grid */}
          <div
            className="dash-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12,1fr)",
              gap: 16,
              gridAutoFlow: "dense",
            }}
          >
            {/* Profile card */}
            <Card style={{ gridColumn: "span 5", gridRow: "span 2", display: "flex", flexDirection: "column", gap: 16, padding: 22 }} delay={0}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div
                  aria-hidden
                  style={{
                    width: 64,
                    height: 64,
                    flex: "none",
                    borderRadius: 999,
                    background: "linear-gradient(135deg,#38bdf8,#34d399)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 20,
                    color: "#0a0d13",
                  }}
                >
                  JL
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>
                    {identity.nameKo}{" "}
                    <span style={{ color: color.muted, fontWeight: 400 }}>/ {identity.nameEn}</span>
                  </div>
                  <div style={{ fontSize: 12, color: color.link, marginTop: 4 }}>
                    {identity.githubPath}
                    <span style={{ color: color.text }}>{identity.githubHandle}</span>
                  </div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: color.textDim }}>{L(bio)}</p>
              <CodeBlock />
              <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                <SocialButton href={links.github} label="GITHUB" />
                <SocialButton href={links.linkedin} label="LINKEDIN" />
                <SocialButton href={links.instagram} label="INSTAGRAM" />
              </div>
            </Card>

            {/* Main stack */}
            <Card id="sec-skills" style={{ gridColumn: "span 4" }} delay={0.05}>
              <SectionLabel>{L(labels.mainStack)}</SectionLabel>
              <TagRow items={mainSkills} />
            </Card>

            {/* Tools */}
            <Card style={{ gridColumn: "span 3" }} delay={0.1}>
              <SectionLabel>{L(labels.tools)}</SectionLabel>
              <TagRow items={tools} />
            </Card>

            {/* Learning */}
            <Card style={{ gridColumn: "span 4" }} delay={0.15}>
              <SectionLabel>{L(labels.learning)}</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {learning.map((item) => (
                  <span
                    key={item}
                    style={{
                      fontSize: 12,
                      padding: "4px 9px",
                      background: "rgba(251,191,36,.08)",
                      border: "1px dashed rgba(251,191,36,.35)",
                      borderRadius: 4,
                      color: color.yellow,
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </Card>

            {/* Awards */}
            <Card id="sec-awards" style={{ gridColumn: "span 3", gridRow: "span 3", display: "flex", flexDirection: "column" }} delay={0.2}>
              <SectionLabel>{L(labels.awards)}</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, overflow: "auto" }}>
                {awards.map((a, i) => (
                  <div key={i} style={{ borderLeft: `2px solid ${a.color}`, paddingLeft: 10 }}>
                    <div style={{ fontSize: 11, color: color.muted }}>{a.date}</div>
                    <div style={{ fontSize: 13, color: color.text, marginTop: 3 }}>{L(a.title)}</div>
                    <div style={{ fontSize: 12, marginTop: 3, color: a.color }}>{L(a.note)}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* GitHub contributions */}
            <Card style={{ gridColumn: "span 5" }} delay={0.25}>
              <SectionLabel>GitHub</SectionLabel>
              <div style={{ display: "flex", gap: 5 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateRows: "repeat(7,1fr)",
                    gap: 3,
                    paddingTop: 14,
                    fontSize: 9,
                    color: color.faint,
                    textAlign: "right",
                    flex: "none",
                  }}
                >
                  {weekdayLabels.map((w, i) => (
                    <div key={i}>{w}</div>
                  ))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(26,1fr)",
                      gap: 3,
                      marginBottom: 4,
                      fontSize: 9,
                      color: color.faint,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {monthLabels.map((m, i) => (
                      <div key={i}>{m}</div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(26,1fr)", gap: 3 }}>
                    {contribCells.map((bg, i) => (
                      <div
                        key={i}
                        title={L(labels.githubLive)}
                        style={{ width: "100%", paddingBottom: "100%", borderRadius: 2, background: bg }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: color.muted, lineHeight: 1.6, marginTop: 10 }}>
                {L(labels.githubNote)}{" "}
                <a href={links.github} target="_blank" rel="noopener noreferrer">
                  github.com/Ruthgyeul
                </a>
              </div>
            </Card>

            {/* In progress */}
            <Card style={{ gridColumn: "span 4" }} delay={0.3}>
              <SectionLabel>{L(labels.inProgress)}</SectionLabel>
              <div style={{ fontSize: 12.5, lineHeight: 1.95, color: color.muted }}>
                <div>
                  On branch <span style={{ color: color.accentSoft }}>main</span>
                </div>
                <div style={{ marginTop: 6, color: color.textDim }}>{L(labels.changes)}</div>
                <div>
                  <span style={{ color: color.yellow }}>modified:</span> Arbitrum Ambassador{" "}
                  <span style={{ color: color.green }}>(ongoing)</span>
                </div>
                <div>
                  <span style={{ color: color.yellow }}>modified:</span> Hyperbolic Ambassador{" "}
                  <span style={{ color: color.green }}>(ongoing)</span>
                </div>
                <div>
                  <span style={{ color: color.accent }}>new file:</span> Blockchain Valley 6th{" "}
                  <span style={{ color: color.muted }}>— Senior</span>
                </div>
              </div>
            </Card>

            {/* Experience */}
            <Card id="sec-experience" style={{ gridColumn: "span 9" }} delay={0.35}>
              <SectionLabel>{L(labels.experience)}</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2.4fr 1.6fr 1.4fr",
                    fontSize: 11,
                    color: color.muted,
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                    padding: "0 0 8px",
                    borderBottom: `1px solid ${color.border}`,
                  }}
                >
                  <span>{L(labels.org)}</span>
                  <span>{L(labels.role)}</span>
                  <span>{L(labels.duration)}</span>
                </div>
                {experience.map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2.4fr 1.6fr 1.4fr",
                      fontSize: 13,
                      padding: "11px 0",
                      borderBottom: "1px solid rgba(255,255,255,.05)",
                    }}
                  >
                    <span>{L(row.org)}</span>
                    <span style={{ color: color.textDim }}>{L(row.role)}</span>
                    <span style={{ color: row.color }}>{L(row.duration)}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Education */}
            <Card id="sec-education" style={{ gridColumn: "span 4" }} delay={0.4}>
              <SectionLabel>Inha University</SectionLabel>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{L(education.degree.title)}</div>
              <div style={{ fontSize: 12, color: color.muted, marginTop: 4, lineHeight: 1.6 }}>
                {L(education.degree.note)}
              </div>
              <TagRow items={education.degree.tags} small style={{ marginTop: 10 }} />
            </Card>

            {/* Blockchain Valley */}
            <Card style={{ gridColumn: "span 5" }} delay={0.45}>
              <SectionLabel>Blockchain Valley 6th</SectionLabel>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{L(education.blockchainValley.title)}</div>
              <div style={{ fontSize: 12, color: color.muted, marginTop: 4, lineHeight: 1.6 }}>
                {L(education.blockchainValley.note)}
              </div>
              <TagRow items={education.blockchainValley.tags} small style={{ marginTop: 10 }} />
            </Card>

            {/* Contact */}
            <Card
              id="sec-contact"
              style={{
                gridColumn: "span 12",
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: 28,
                flexWrap: "wrap",
                fontSize: 12,
                color: color.muted,
              }}
              delay={0.5}
            >
              <span>{L(labels.contact)} —</span>
              <ContactLink href={links.github} label="GitHub · Ruthgyeul" hint="G" />
              <ContactLink href={links.linkedin} label="LinkedIn · leejaeah" hint="L" />
              <ContactLink href={links.instagram} label="Instagram · jae.__.ah" hint="I" />
              <span style={{ marginLeft: "auto" }}>{L(labels.copyright)}</span>
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
  style,
  id,
  delay = 0,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  id?: string;
  delay?: number;
}) {
  return (
    <div
      id={id}
      className="card"
      style={{
        background: color.card,
        border: `1px solid ${color.border}`,
        borderRadius: 8,
        padding: 18,
        animation: "fadeUp .5s ease both",
        animationDelay: `${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        color: color.muted,
        textTransform: "uppercase",
        letterSpacing: ".06em",
        marginBottom: 14,
      }}
    >
      <span style={{ color: color.faint, fontWeight: 600 }}>{"//"}</span>
      {children}
    </div>
  );
}

function TagRow({
  items,
  small = false,
  style,
}: {
  items: readonly string[];
  small?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: small ? 6 : 7, ...style }}>
      {items.map((item) => (
        <span
          key={item}
          style={{
            fontSize: small ? 11 : 12,
            padding: small ? "3px 8px" : "4px 9px",
            background: "rgba(255,255,255,.04)",
            borderRadius: 4,
            color: color.textDim,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function SocialButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="hover-accent"
      style={{
        flex: 1,
        textAlign: "center",
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: 6,
        padding: 9,
        fontSize: 12,
        color: color.text,
        textDecoration: "none",
      }}
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
      className="hover-accent"
      style={{
        color: color.text,
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color.green }} />
      {label}
      <span
        style={{
          fontSize: 10,
          padding: "1px 5px",
          border: "1px solid rgba(255,255,255,.15)",
          borderRadius: 3,
          color: color.faint,
        }}
      >
        {hint}
      </span>
    </a>
  );
}

function CodeBlock() {
  return (
    <div
      style={{
        background: color.cardInset,
        border: `1px solid ${color.borderSoft}`,
        borderRadius: 6,
        padding: "12px 14px",
        fontSize: 12.5,
        lineHeight: 1.8,
        display: "flex",
        gap: 12,
      }}
    >
      <div style={{ color: color.gutter, textAlign: "right", userSelect: "none" }}>
        1<br />2<br />3<br />4<br />5
      </div>
      <div>
        <div>
          <span style={{ color: color.muted }}>const</span>{" "}
          <span style={{ color: color.accentSoft }}>profile</span>{" "}
          <span style={{ color: color.muted }}>=</span> {"{"}
        </div>
        <div style={{ paddingLeft: 16 }}>
          <span style={{ color: color.pink }}>role</span>:{" "}
          <span style={{ color: color.lime }}>&apos;Full-Stack Developer&apos;</span>,
        </div>
        <div style={{ paddingLeft: 16 }}>
          <span style={{ color: color.pink }}>focus</span>: [
          <span style={{ color: color.lime }}>&apos;web3&apos;</span>,{" "}
          <span style={{ color: color.lime }}>&apos;blockchain&apos;</span>,{" "}
          <span style={{ color: color.lime }}>&apos;cloud&apos;</span>],
        </div>
        <div style={{ paddingLeft: 16 }}>
          <span style={{ color: color.pink }}>status</span>:{" "}
          <span style={{ color: color.yellow }}>&apos;available&apos;</span>
        </div>
        <div>
          {"}"}
          <span style={{ color: color.green, animation: "pulse .9s step-end infinite" }}>▌</span>
        </div>
      </div>
    </div>
  );
}
