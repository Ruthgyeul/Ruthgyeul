import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

/**
 * Self-hosted IBM Plex Mono. Bundling the font (rather than linking Google
 * Fonts at runtime) removes a third-party dependency from the critical path —
 * better availability and no layout shift.
 */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-mono",
});

const SITE_URL = "https://ruthgyeul.xyz";
const TITLE = "Jaeah Lee — Full-Stack Developer";
const DESCRIPTION =
  "이재아 / Jaeah Lee — Web3, blockchain and cloud full-stack developer. Inha University CSE. Building real services, smart contracts and dApps.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Jaeah Lee",
  },
  description: DESCRIPTION,
  applicationName: "Jaeah Lee",
  authors: [{ name: "Jaeah Lee", url: SITE_URL }],
  creator: "Jaeah Lee",
  publisher: "Jaeah Lee",
  category: "technology",
  keywords: [
    "Jaeah Lee",
    "이재아",
    "Ruthgyeul",
    "full-stack developer",
    "풀스택 개발자",
    "Web3",
    "blockchain",
    "smart contract",
    "Solidity",
    "dApp",
    "cloud",
    "React",
    "Next.js",
    "TypeScript",
    "Inha University",
    "인하대학교",
    "portfolio",
  ],
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "ko-KR": "/",
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/icons/512x512.png", sizes: "512x512", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Jaeah Lee",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { email: false, telephone: false, address: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: SITE_URL,
    siteName: "Jaeah Lee",
    locale: "en_US",
    alternateLocale: ["ko_KR"],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

/**
 * Schema.org Person markup so search engines and social/AI crawlers can render
 * a rich knowledge panel for the site owner. Kept in sync with content.ts.
 */
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Jaeah Lee",
  alternateName: "이재아",
  url: SITE_URL,
  image: `${SITE_URL}/icons/512x512.png`,
  jobTitle: "Full-Stack Developer",
  description: DESCRIPTION,
  knowsAbout: [
    "Web3",
    "Blockchain",
    "Smart Contracts",
    "Solidity",
    "Cloud Computing",
    "Full-Stack Development",
    "React",
    "Next.js",
    "TypeScript",
  ],
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Inha University",
    sameAs: "https://www.inha.ac.kr",
  },
  sameAs: [
    "https://github.com/Ruthgyeul",
    "https://www.linkedin.com/in/leejaeah",
    "https://www.instagram.com/jae.__.ah/",
  ],
};

export const viewport: Viewport = {
  themeColor: "#0a0d13",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={plexMono.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
