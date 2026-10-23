"use client";

import Image from "next/image";
import { useRef } from "react";
import SectionIntro from "@/components/SectionIntro";
import { gsap, MQ, revealIntro, useGSAP } from "@/lib/motion";
import { IMAGES } from "@/lib/site";

// Positions in % of the hero photo, so they travel with the body as it pans.
const SURFACES = [
  { label: "Hood extractors", x: 35, y: 40 },
  { label: "LED signature", x: 52.5, y: 50 },
  { label: "Forged wheel", x: 66, y: 61 },
  { label: "Sculpted side intake", x: 85, y: 42 },
];

export default function DesignSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const win = q("[data-window]")[0];
      const track = q("[data-track]")[0];
      // Start with the nose in frame, finish on the rear wheel.
      const from = () => -track.offsetWidth * 0.1;
      const travel = () => -(track.offsetWidth - win.offsetWidth);

      const mm = gsap.matchMedia();
      mm.add({ desktop: MQ.desktop, motion: MQ.motion }, (ctx) => {
        if (!ctx.conditions?.motion) return;
        revealIntro(root.current!, ctx.conditions.desktop ? "top 60%" : "top 75%");

        // The window opens like an aperture as the section arrives.
        gsap.fromTo(
          win,
          { clipPath: "inset(12% 0% 12% 35%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            ease: "power1.inOut",
            scrollTrigger: { trigger: root.current, start: "top 85%", end: ctx.conditions.desktop ? "top top" : "top 15%", scrub: 0.5 },
          },
        );

        if (ctx.conditions.desktop) {
          // Desktop: pin and dolly the camera from nose to tail.
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: () => `+=${Math.round(window.innerHeight * 1.6)}`,
              pin: true,
              scrub: 0.5,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });
          tl.fromTo(track, { x: from }, { x: travel, duration: 1 }, 0)
            .fromTo(q("[data-dolly]"), { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
            .fromTo(q("[data-num]"), { yPercent: 0 }, { yPercent: -40, duration: 1 }, 0);
        } else {
          // Mobile: no pin — the pan simply follows the section through the viewport.
          gsap.fromTo(
            track,
            { x: from },
            { x: travel, ease: "none", scrollTrigger: { trigger: win, start: "top bottom", end: "bottom top", scrub: 0.5, invalidateOnRefresh: true } },
          );
          gsap.fromTo(q("[data-dolly]"), { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: win, start: "top bottom", end: "bottom top", scrub: 0.5 } });
        }
      });
    },
    { scope: root },
  );

  return (
    <section
      id="design"
      ref={root}
      tabIndex={-1}
      aria-labelledby="design-title"
      className="relative overflow-hidden bg-carbon outline-none md:h-svh md:min-h-[36rem]"
    >
      <div className="grid h-full md:grid-cols-[38%_62%]">
        <SectionIntro
          className="z-10 flex flex-col justify-center px-[var(--gutter)] py-24 md:py-0"
          index="02"
          eyebrow="Design"
          title={["Sculpted", "for impact"]}
          headingId="design-title"
          copy="A balance of elegance and aggression. Every curve tells a story of speed, style and innovation."
        >
          <div data-fade aria-hidden className="mt-12 max-w-xs">
            <div className="t-micro flex justify-between text-muted">
              <span>Nose</span>
              <span>Camera dolly</span>
              <span>Tail</span>
            </div>
            <div className="mt-3 h-px bg-paper/15">
              <div data-dolly className="h-full origin-left bg-crimson" />
            </div>
          </div>
        </SectionIntro>

        <div data-window className="relative h-[62svh] overflow-hidden md:h-full">
          <div data-track className="absolute -top-[5%] left-0 h-[110%] aspect-[1860/724] will-change-transform">
            <Image
              src={IMAGES.heroSilver.src}
              alt="Close tracking shot along the silver FIZZ body, from the lit front end past the forged wheel to the side intake"
              fill
              sizes="(min-width: 768px) 190vw, 300vw"
              className="object-cover"
            />
            {SURFACES.map((s) => (
              <div key={s.label} className="absolute z-[2]" style={{ left: `${s.x}%`, top: `${s.y}%` }} aria-hidden>
                <div className="absolute -left-[4.5px] -top-[4.5px] flex items-start gap-3">
                  <span className="callout-dot shrink-0" />
                  <span className="mt-1 block h-10 w-px bg-paper/40" />
                  <span className="t-micro mt-10 -ml-3 whitespace-nowrap text-paper/90 [text-shadow:0_1px_12px_rgb(0_0_0/0.95)]">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--color-carbon)_0%,transparent_22%,transparent_85%,rgb(11_12_15/0.8)_100%),linear-gradient(0deg,rgb(11_12_15/0.7),transparent_30%)]" />
        </div>
      </div>
    </section>
  );
}
