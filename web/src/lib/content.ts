import { color } from "./theme";

/**
 * All site content lives here — bilingual (Korean / English).
 *
 * To update the portfolio, edit this file only: add an award, a role, a skill,
 * change the bio, etc. Components read from these structures and never hardcode
 * copy, which keeps the site easy to maintain and extend.
 */

export type Lang = "ko" | "en";

/** A bilingual string. */
export interface I18nText {
  ko: string;
  en: string;
}

/** Pick the active language from a bilingual string. */
export const t = (text: I18nText, lang: Lang): string => text[lang];

export const links = {
  github: "https://github.com/Ruthgyeul",
  linkedin: "https://www.linkedin.com/in/leejaeah",
  instagram: "https://www.instagram.com/jae.__.ah/",
} as const;

export const identity = {
  nameKo: "이재아",
  nameEn: "Jaeah Lee",
  githubHandle: "Ruthgyeul",
  githubPath: "~/github.com/",
} as const;

export const whoami: I18nText = {
  ko: "이재아 — 인하대 컴퓨터공학과, 웹3·블록체인·클라우드를 넘나드는 풀스택 개발자",
  en: "Jaeah Lee — CS @ Inha University, full-stack developer across Web3, blockchain and cloud",
};

export const bootLines: Record<Lang, string[]> = {
  ko: ["커널 초기화 중...", "모듈 로딩 중...", "portfolio.fs 마운트 중...", "준비 완료."],
  en: ["Initializing kernel...", "Loading modules...", "Mounting portfolio.fs...", "Ready."],
};

export const bio: I18nText = {
  ko: "웹3, 블록체인, 클라우드 전반을 다루는 풀스택 개발자입니다. 인하대학교 컴퓨터공학과에서 공부하며 실제 서비스와 스마트 컨트랙트를 만듭니다.",
  en: "A full-stack developer working across Web3, blockchain and cloud. Studying Computer Science Engineering at Inha University while shipping real services and smart contracts.",
};

export const statusLine: I18nText = {
  ko: "현재 활동 중 — Blockchain Valley 6기 Senior · Arbitrum & Hyperbolic Ambassador",
  en: "Currently active — Blockchain Valley 6th Senior · Arbitrum & Hyperbolic Ambassador",
};

export const mainSkills = [
  "JavaScript",
  "TypeScript",
  "Node.js",
  "React",
  "Next.js",
  "Python",
  "C",
  "C++",
  "Solidity",
  "Java",
  "Spring",
  "Tailwind",
  "OpenCV",
] as const;

export const tools = [
  "VS Code",
  "WebStorm",
  "IntelliJ",
  "Vim",
  "AWS",
  "Firebase",
  "Cloudflare",
  "Git",
  "Docker",
  "K8s",
  "MySQL",
  "MongoDB",
] as const;

export const learning = ["PHP", "FastAPI", "Figma"] as const;

export interface Award {
  date: string;
  color: string;
  title: I18nText;
  note: I18nText;
}

export const awards: Award[] = [
  {
    date: "2025.03.25",
    color: color.green,
    title: { ko: "AI로 그리는 혁신 비즈니스", en: "Innovation Business Drawn by AI" },
    note: { ko: "최우수상(1등) · Smart Contract", en: "Grand Prize (1st) · Smart Contract" },
  },
  {
    date: "2025.01",
    color: color.accent,
    title: { ko: "GroovyBet", en: "GroovyBet" },
    note: { ko: "Zetachain상 · Backend", en: "Zetachain Award · Backend" },
  },
  {
    date: "2024.11",
    color: color.pink,
    title: { ko: "IN!PICK", en: "IN!PICK" },
    note: { ko: "우수상(2위) · Frontend", en: "Excellence Award (2nd) · Frontend" },
  },
  {
    date: "2023.08",
    color: color.yellow,
    title: { ko: "충청남도지사상", en: "Chungnam Governor's Award" },
    note: { ko: "우수상(2위) · AWS/Backend", en: "Excellence Award (2nd) · AWS/Backend" },
  },
];

export interface Experience {
  org: I18nText;
  role: I18nText;
  duration: I18nText;
  color: string;
}

export const experience: Experience[] = [
  {
    org: { ko: "GDGoC at Inha: Core Member", en: "GDGoC at Inha: Core Member" },
    role: { ko: "Tech Team FE", en: "Tech Team FE" },
    duration: { ko: "2025.03–2025.06", en: "2025.03–2025.06" },
    color: color.muted,
  },
  {
    org: { ko: "Arbitrum", en: "Arbitrum" },
    role: { ko: "Ambassador", en: "Ambassador" },
    duration: { ko: "2025.02–현재", en: "2025.02–Present" },
    color: color.green,
  },
  {
    org: { ko: "Hyperbolic", en: "Hyperbolic" },
    role: { ko: "Ambassador", en: "Ambassador" },
    duration: { ko: "2025.02–현재", en: "2025.02–Present" },
    color: color.green,
  },
  {
    org: { ko: "Blockchain Valley 6th", en: "Blockchain Valley 6th" },
    role: { ko: "Dev. Team Senior", en: "Dev. Team Senior" },
    duration: { ko: "2024.09–보류", en: "2024.09–On hold" },
    color: color.muted,
  },
  {
    org: {
      ko: "2024 알파코 청소년 디지털 문제해결 프로젝트",
      en: "2024 Alpaco Youth Digital Problem-Solving Project",
    },
    role: { ko: "심화 프로그램 멘토", en: "Advanced Program Mentor" },
    duration: { ko: "2024.08–2024.11", en: "2024.08–2024.11" },
    color: color.muted,
  },
  {
    org: {
      ko: "2024 INHA SW NET-ZERO 공동 해커톤",
      en: "2024 INHA SW NET-ZERO Joint Hackathon",
    },
    role: { ko: "운영진", en: "Organizer" },
    duration: { ko: "2024.07", en: "2024.07" },
    color: color.muted,
  },
  {
    org: {
      ko: "IGRUS (인하대 프로그래밍 학술 동아리)",
      en: "IGRUS (Inha Programming Club)",
    },
    role: { ko: "기술부 부원", en: "Tech Team Member" },
    duration: { ko: "2024.03–2024.08", en: "2024.03–2024.08" },
    color: color.muted,
  },
];

export const education = {
  degree: {
    title: { ko: "컴퓨터공학과 24학번", en: "Computer Science Engineering, '24" },
    note: { ko: "학부 2년차 재학 중", en: "Undergraduate — Year 2" },
    tags: ["AWS", "Data Structure", "Algorithm", "Java"],
  },
  blockchainValley: {
    title: { ko: "개발팀", en: "Development Team" },
    note: { ko: "2024년부터 (6기, Senior)", en: "Since 2024 (6th cohort, Senior)" },
    tags: ["Blockchain", "Web3", "Solidity", "dApp", "DAO", "DID"],
  },
} as const;

/** UI label strings used across the dashboard. */
export const labels = {
  available: { ko: "Available", en: "Available" },
  availTip: { ko: "평균 응답 시간 ~24시간", en: "Average response time ~24h" },
  mainStack: { ko: "Main Stack", en: "Main Stack" },
  tools: { ko: "Tools", en: "Tools" },
  learning: { ko: "Learning", en: "Learning" },
  awards: { ko: "Award Log", en: "Award Log" },
  inProgress: { ko: "In Progress", en: "In Progress" },
  changes: { ko: "Changes:", en: "Changes:" },
  experience: { ko: "Experience", en: "Experience" },
  org: { ko: "Organization", en: "Organization" },
  role: { ko: "Role", en: "Role" },
  duration: { ko: "Duration", en: "Duration" },
  contact: { ko: "Contact", en: "Contact" },
  copyright: { ko: "© 2026 이재아", en: "© 2026 Jaeah Lee" },
  githubNote: { ko: "실시간 커밋 활동은", en: "Live commit activity on" },
  githubLive: { ko: "실시간은 GitHub에서 확인", en: "Live activity on GitHub" },
  githubContribs: { ko: "contributions in the last year", en: "contributions in the last year" },
  githubRepos: { ko: "public repos", en: "public repos" },
  githubFollowers: { ko: "followers", en: "followers" },
  repositories: { ko: "Repositories", en: "Repositories" },
  reposLive: { ko: "Live from GitHub", en: "Live from GitHub" },
  recentActivity: { ko: "Recent Activity", en: "Recent Activity" },
  onBranch: { ko: "on branch", en: "on branch" },
  languages: { ko: "Languages", en: "Languages" },
  currentStreak: { ko: "Current streak", en: "Current streak" },
  longestStreak: { ko: "Longest streak", en: "Longest streak" },
  totalStars: { ko: "Total stars", en: "Total stars" },
  days: { ko: "days", en: "days" },
  archived: { ko: "archived", en: "archived" },
  fullStack: { ko: "Full-Stack Developer", en: "Full-Stack Developer" },
  university: { ko: "인하대학교", en: "Inha University" },
  palettePlaceholder: {
    ko: "이동하거나 실행할 항목 검색...",
    en: "Search a place or action...",
  },
  toggleLang: { ko: "언어 전환 (한/영)", en: "Toggle language" },
} satisfies Record<string, I18nText>;

/** Weekday short names for the contribution graph gutter. */
export const weekdayShort: Record<Lang, string[]> = {
  ko: ["일", "월", "화", "수", "목", "금", "토"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

/**
 * Compact relative time for a repo's last push, e.g. "3 days ago" / "3일 전".
 * Client-only (reads the current time); repo tiles render after the live fetch.
 */
export const relativeTime = (iso: string, lang: Lang): string => {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return lang === "ko" ? "오늘" : "today";
  if (days === 1) return lang === "ko" ? "어제" : "yesterday";
  if (days < 30) return lang === "ko" ? `${days}일 전` : `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) {
    return lang === "ko" ? `${months}개월 전` : `${months} month${months > 1 ? "s" : ""} ago`;
  }
  const years = Math.floor(days / 365);
  return lang === "ko" ? `${years}년 전` : `${years} year${years > 1 ? "s" : ""} ago`;
};

/** Short month names, used to format contribution-cell tooltips. */
export const monthShort: Record<Lang, string[]> = {
  ko: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

/**
 * Human-readable tooltip for one contribution cell, e.g.
 * "3 contributions on Jul 10" / "7월 10일 · 3 기여".
 */
export const contribTitle = (
  date: string,
  count: number,
  lang: Lang,
): string => {
  if (!date) return "";
  const [, m, d] = date.split("-").map(Number);
  const md = lang === "ko" ? `${m}월 ${d}일` : `${monthShort.en[m - 1]} ${d}`;
  if (count <= 0) return lang === "ko" ? `${md} · 기여 없음` : `No contributions on ${md}`;
  return lang === "ko"
    ? `${md} · ${count} 기여`
    : `${count} contribution${count > 1 ? "s" : ""} on ${md}`;
};
