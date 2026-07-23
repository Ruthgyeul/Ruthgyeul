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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Jaeah Lee — Full-Stack Developer",
  description:
    "이재아 / Jaeah Lee — Web3, blockchain and cloud full-stack developer. Inha University CSE.",
  alternates: { canonical: "/" },
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
  openGraph: {
    title: "Jaeah Lee — Full-Stack Developer",
    description:
      "Web3, blockchain and cloud full-stack developer. Inha University CSE.",
    type: "website",
    url: SITE_URL,
  },
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
      <body>{children}</body>
    </html>
  );
}
