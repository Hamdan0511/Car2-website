"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import Hotspot from "@/components/driver/Hotspot";
import SectionIntro from "@/components/SectionIntro";
import type { DiscoveryId } from "@/lib/driver";
import { driver } from "@/lib/driverStore";
import { MQ, revealIntro, useMotion } from "@/lib/motion";
import { IMAGES } from "@/lib/site";

// Inspection points, positioned in % of the hero photo so they travel with the
// body as it pans. Notes describe what the photograph visibly shows — styling
// observations, not specifications. `group` feeds the inspection checklist.
const SURFACES: { label: string; x: number; y: number; group: DiscoveryId; note: string }[] = [
  {
    label: "Hood extractors",
    x: 35,
    y: 40,
    group: "front",
    note: "Two dark vents are cut into the bonnet. They lighten the visual mass of the nose and lead the eye back over the car.",
  },
  {
    label: "LED signature",
    x: 52.5,
    y: 50,
    group: "front",
    note: "The headlight is drawn as one thin, swept LED blade — it gives the face its sharp, focused expression.",
  },
  {
    label: "Forged wheel",
    x: 66,
    y: 61,
    group: "side",
    note: "Multi-spoke wheels in a dark finish, with red brake calipers visible between the spokes.",
  },
  {
    label: "Sculpted side intake",
    x: 85,
    y: 42,
    group: "side",
    note: "A deep scoop is carved into the flank ahead of the rear wheel, pinching the body into a sculpted waist.",
  },
];

export default function DesignSection() {
  const root = useRef<HTMLElement>(null);
  // Rendered pin spacer: ScrollTrigger pins inside it instead of re-parenting the
  // section into a generated wrapper. Re-parenting restarts CSS animations
  // (the opening sequence) and moves React-managed nodes behind React's back.
  const spacer = useRef<HTMLDivElement>(null);
  const [inspected, setInspected] = useState<number | null>(null);
  const selected = inspected === null ? null : SURFACES[inspected];

  // Queued after the hero, one component per frame, once GSAP has loaded (lib/motion).
  useMotion(root, ({ gsap, q }) => {
    const win = q("[data-window]")[0];
    const track = q("[data-track]")[0];
    // Start with the nose in frame, finish on the rear wheel.
    const from = () => -track.offsetWidth * 0.1;
    const travel = () => -(track.offsetWidth - win.offsetWidth);

    const mm = gsap.matchMedia();
    mm.add({ desktop: MQ.wide, motion: MQ.motion }, (ctx) => {
      if (!ctx.conditions?.motion) return;
      revealIntro(gsap, root.current!, ctx.conditions.desktop ? "top 60%" : "top 75%");

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
            pinSpacer: spacer.current,
            scrub: 0.5,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        // Gentle ease-in/out reads as a physical dolly starting and stopping.
        tl.fromTo(track, { x: from }, { x: travel, duration: 1, ease: "sine.inOut" }, 0)
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
  });

  return (
    <div ref={spacer}>
      <section
        id="design"
        ref={root}
        tabIndex={-1}
        aria-labelledby="design-title"
        className="relative overflow-hidden bg-carbon outline-none wide:h-svh wide:min-h-[36rem]"
      >
        <div className="grid h-full wide:grid-cols-[38%_62%] wide:grid-rows-[1fr_auto]">
          <SectionIntro
            className="z-10 flex flex-col justify-center px-[var(--gutter)] py-24 wide:col-start-1 wide:row-start-1 wide:py-0"
            index="02"
            eyebrow="Design"
            title={["Sculpted", "for impact"]}
            headingId="design-title"
            titleSize="text-[clamp(2rem,3.8vw,4.1rem)]"
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

          <div data-window className="relative h-[62svh] overflow-hidden wide:col-start-2 wide:row-span-2 wide:row-start-1 wide:h-full">
            <div data-track className="absolute top-0 left-0 h-full aspect-[1860/724]">
              <Image
                src={IMAGES.heroSilver.src}
                alt="Slow pan across the front three-quarter photograph of the silver FIZZ: lit headlight, forged wheel and side intake"
                fill
                sizes="(min-width: 768px) and (min-aspect-ratio: 1/1) 165vw, (min-width: 768px) 230vw, 350vw"
                className="object-cover"
              />
              {SURFACES.map((s, i) => (
                <div key={s.label} className="absolute z-[2] -ml-[22px] -mt-[22px]" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
                  <Hotspot
                    label={s.label}
                    active={inspected === i}
                    controls="design-inspector"
                    onSelect={() => {
                      setInspected(i);
                      driver.discover(s.group);
                    }}
                  />
                </div>
              ))}
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--color-carbon)_0%,transparent_22%,transparent_85%,rgb(11_12_15/0.8)_100%),linear-gradient(0deg,rgb(11_12_15/0.7),transparent_30%)]" />
          </div>

          {/* Inspector: details of the selected point, beside (wide) or below (stacked) the photo. */}
          <div
            id="design-inspector"
            aria-live="polite"
            className="z-10 min-h-36 px-[var(--gutter)] pt-8 pb-16 wide:col-start-1 wide:row-start-2 wide:min-h-44 wide:pt-0 wide:pb-[7svh]"
          >
            <p className="t-micro flex items-center gap-3 text-muted">
              <span aria-hidden className="block h-px w-6 bg-crimson" />
              Inspection
            </p>
            {selected ? (
              <>
                <p className="mt-3 text-sm uppercase tracking-[0.2em] text-paper">{selected.label}</p>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-silver/75">{selected.note}</p>
              </>
            ) : (
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-silver/60">
                Select a point on the car to inspect it. Observations describe the photograph — not specifications.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
