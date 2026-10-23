import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Jost } from "next/font/google";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "FIZZ — Built Different",
  description:
    "FIZZ is a cinematic, scroll-driven automotive concept experience built with Next.js, Tailwind CSS and GSAP ScrollTrigger.",
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jost.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks JS as available before first paint so intro elements can start hidden. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
