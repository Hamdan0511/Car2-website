"use client";

import { useRef } from "react";
import { MQ, revealIntro, useMotion } from "@/lib/motion";

// Illustrative design index values for a fictional brand — not measurements.
const INDEX = [
  { label: "Precision", value: 98, note: "Panel-gap and surface tolerance target" },
  { label: "Aerodynamics", value: 92, note: "Form-follows-airflow design score" },
  { label: "Engineering", value: 96, note: "Material and structural ambition" },
  { label: "Driving experience", value: 99, note: "Feel, response and sound" },
];

export default function EngineeringSection() {
  const root = useRef<HTMLElement>(null);

  // Queued after the hero, one component per frame, once GSAP has loaded (lib/motion).
  useMotion(root, ({ gsap, q }) => {
    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      revealIntro(gsap, q("[data-head]")[0]);

      // Oversized marquee slides horizontally against the vertical scroll.
      gsap.fromTo(
        q("[data-marquee]"),
        { xPercent: 0 },
        { xPercent: -30, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.5 } },
      );

      // Each row's bar and counter are scrubbed together, so the number
      // always matches the bar length for any scroll position.
      q("[data-row]").forEach((row) => {
        const count = row.querySelector<HTMLElement>("[data-value]")!;
        const target = Number(count.dataset.value);
        gsap
          .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: row, start: "top 88%", end: "top 48%", scrub: 0.4 } })
          .fromTo(row.querySelector("[data-bar]"), { scaleX: 0 }, { scaleX: target / 100 }, 0)
          .fromTo(count, { textContent: 0 }, { textContent: target, snap: { textContent: 1 } }, 0);
        gsap.fromTo(row, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: row, start: "top 90%", toggleActions: "play none none reverse" } });
      });
    });
  });

  return (
    <section
      id="engineering"
      ref={root}
      tabIndex={-1}
      aria-labelledby="engineering-title"
      className="relative overflow-hidden bg-carbon py-24 outline-none md:py-36"
    >
      <div aria-hidden className="tech-grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="pointer-events-none overflow-hidden whitespace-nowrap">
        <p data-marquee className="ghost-type text-[clamp(4rem,12vw,11rem)] font-extralight uppercase leading-none tracking-[0.12em]">
          Precision — Aerodynamics — Engineering — Precision — Aerodynamics
        </p>
      </div>

      <div className="relative mt-16 grid gap-14 px-[var(--gutter)] md:mt-24 md:grid-cols-12">
        <div data-head className="md:col-span-5">
          <p data-fade className="t-eyebrow flex items-center gap-4">
            <span aria-hidden data-accent className="block h-px w-10 origin-left bg-crimson" />
            Engineering
          </p>
          <h2 id="engineering-title" className="t-display mt-6 text-[clamp(1.5rem,2.7vw,2.8rem)]">
            <span className="line-mask"><span data-line className="block">Engineered</span></span>
            <span className="line-mask"><span data-line className="block">without</span></span>
            <span className="line-mask"><span data-line className="block">compromise</span></span>
          </h2>
          <p data-fade className="t-copy mt-7">
            Four disciplines, one obsession. A design index for how the FIZZ concept is meant to feel.
          </p>
        </div>

        <div className="md:col-span-7 md:col-start-6 lg:col-span-6 lg:col-start-7">
          <ul className="divide-y divide-paper/10 border-y border-paper/10">
            {INDEX.map((item, i) => (
              <li key={item.label} data-row className="grid grid-cols-[auto_1fr] items-end gap-x-6 gap-y-4 py-7 md:grid-cols-[3rem_1fr_auto] md:gap-x-10">
                <span className="t-micro self-start pt-2 text-crimson">0{i + 1}</span>
                <div>
                  <p className="t-micro text-paper">{item.label}</p>
                  <p className="mt-2 text-sm text-silver/55">{item.note}</p>
                  <div aria-hidden className="mt-5 h-px bg-paper/10">
                    <div data-bar className="h-full origin-left bg-gradient-to-r from-crimson/50 to-crimson" />
                  </div>
                </div>
                <p className="col-span-2 text-[clamp(3rem,6.5vw,6rem)] font-extralight leading-[0.8] text-paper tabular-nums md:col-span-1">
                  <span data-value={item.value}>{item.value}</span>
                  <span className="ml-1 align-top text-base font-light text-muted">/100</span>
                </p>
              </li>
            ))}
          </ul>
          <p className="t-micro mt-6 leading-relaxed text-muted">
            * Illustrative design index values for a concept site. Not measured vehicle specifications.
          </p>
        </div>
      </div>
    </section>
  );
}
