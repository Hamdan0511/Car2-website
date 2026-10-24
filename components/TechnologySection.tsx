"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import SectionIntro from "@/components/SectionIntro";
import { driver } from "@/lib/driverStore";
import { MQ, revealIntro, useMotion } from "@/lib/motion";
import { IMAGES } from "@/lib/site";

// Positions in % of the overhead photo. Notes describe what the photograph
// visibly shows — styling observations, not specifications or functions.
// Inspecting any of them logs the "rear styling" checklist item.
const SYSTEMS = [
  { n: "01", label: "Roof air scoop", note: "A raised scoop sits on the roof’s centreline, just behind the cabin.", x: 50, y: 9 },
  { n: "02", label: "Light spine", note: "A single crimson line runs the length of the engine cover, splitting the car in two.", x: 50, y: 40 },
  { n: "03", label: "Light blade", note: "The tail lights are drawn as one full-width blade across the rear.", x: 66.5, y: 68.5 },
  { n: "04", label: "Rear diffuser", note: "Sculpted lower bodywork wraps the rear, framed by the light blade.", x: 50, y: 88 },
];

export default function TechnologySection() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const select = (i: number) => {
    setActive(i);
    driver.discover("rear");
  };

  // Queued after the hero, one component per frame, once GSAP has loaded (lib/motion).
  useMotion(root, ({ gsap, q }) => {
    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      revealIntro(gsap, root.current!);
      gsap.fromTo(
        q("[data-legend] li"),
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1,
          y: 0,
          stagger: 0.1,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: q("[data-legend]")[0], start: "top 80%", toggleActions: "play none none reverse" },
        },
      );

      // The camera pulls back from the light spine, then the red lighting
      // comes up and the callouts draw in — all scrubbed to scroll.
      const figure = q("[data-figure]")[0];
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: figure, start: "top bottom", end: "center center", scrub: 0.5 },
        })
        .fromTo(q("[data-zoom]"), { scale: 1.45, yPercent: 8 }, { scale: 1, yPercent: 0, duration: 6 }, 0)
        .fromTo(q("[data-red]"), { autoAlpha: 0.15 }, { autoAlpha: 1, duration: 5 }, 2)
        .fromTo(q("[data-marker]"), { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, stagger: 0.5, duration: 1 }, 5)
        .fromTo(q("[data-marker-label]"), { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, stagger: 0.5, duration: 1 }, 5.4);
    });
  });

  return (
    <section
      id="technology"
      ref={root}
      tabIndex={-1}
      aria-labelledby="technology-title"
      className="relative overflow-hidden bg-ink py-24 outline-none md:py-36"
    >
      <div className="grid gap-14 px-[var(--gutter)] md:grid-cols-12 md:gap-8">
        <SectionIntro
          className="md:col-span-6"
          index="03"
          eyebrow="Technology"
          title={["Built", "different"]}
          headingId="technology-title"
          copy="Advanced technology meets pure emotion. A driving experience like no other."
        />
        <ol data-legend className="grid content-end gap-x-10 gap-y-6 sm:grid-cols-2 md:col-span-5 md:col-start-8 md:grid-cols-1 lg:grid-cols-2">
          {SYSTEMS.map((s, i) => (
            <li key={s.n} className={`border-t pt-1 transition-colors duration-500 ${active === i ? "border-crimson" : "border-paper/10"}`}>
              <button
                type="button"
                id={`tech-point-${s.n}`}
                aria-pressed={active === i}
                onClick={() => select(i)}
                className="group/lg block min-h-11 w-full py-3 text-left"
              >
                <span className={`t-micro flex gap-3 transition-colors ${active === i ? "text-crimson" : "text-paper group-hover/lg:text-crimson"}`}>
                  <span className="text-crimson">{s.n}</span>
                  {s.label}
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-silver/60">{s.note}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <figure data-figure className="relative mx-[calc((100%-220vw)/2)] mt-16 aspect-[2171/724] w-[220vw] overflow-hidden md:mx-[calc((100%-112vw)/2)] md:mt-24 md:w-[112vw]">
        <div data-zoom className="absolute inset-0 origin-[50%_45%]">
          <Image src={IMAGES.redline.src} alt={IMAGES.redline.alt} fill sizes="(min-width: 768px) 112vw, 220vw" className="object-cover" />
          <div
            aria-hidden
            data-red
            className="absolute inset-0 bg-[radial-gradient(ellipse_30%_45%_at_50%_45%,rgb(255_38_59/0.25),transparent_70%)]"
          />
          {SYSTEMS.map((s, i) => (
            <div key={s.n} className="absolute z-[2]" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
              {/* 44 px hit area around the 24 px numbered marker. */}
              <button
                type="button"
                data-marker
                aria-label={`Inspect: ${s.label}`}
                aria-pressed={active === i}
                aria-describedby={`tech-point-${s.n}`}
                onClick={() => select(i)}
                className="absolute -left-[22px] -top-[22px] grid size-11 place-items-center rounded-full"
              >
                <span
                  aria-hidden
                  className={`grid size-6 place-items-center rounded-full border border-crimson font-mono text-[9px] text-paper shadow-[0_0_14px_rgb(255_38_59/0.6)] transition-colors duration-500 ${
                    active === i ? "bg-crimson" : "bg-ink/70"
                  }`}
                >
                  {s.n}
                </span>
              </button>
              <span aria-hidden data-marker-label className="t-micro absolute left-6 top-1/2 hidden -translate-y-1/2 whitespace-nowrap text-paper/85 lg:block">
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,var(--color-ink),transparent_25%,transparent_80%,var(--color-ink))]" />
        <figcaption className="t-micro absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-muted">
          Plan view · Redline lighting
        </figcaption>
      </figure>
    </section>
  );
}
