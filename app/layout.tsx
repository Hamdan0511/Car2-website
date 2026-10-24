import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Jost } from "next/font/google";
import { INTRO_SEEN_KEY } from "@/lib/driver";
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
        {/* Runs before first paint: marks JS as available, and gives returning visitors a
            compressed opening (same choreography, --t scales every CSS timing). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              `var d=document.documentElement;d.classList.add('js');try{if(localStorage.getItem('${INTRO_SEEN_KEY}'))d.style.setProperty('--t','0.4')}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
