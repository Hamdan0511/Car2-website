"use client";

import Image from "next/image";
import { useRef } from "react";
import SectionIntro from "@/components/SectionIntro";
import { gsap, MQ, revealIntro, scrollToTarget, useGSAP } from "@/lib/motion";
import { IMAGES } from "@/lib/site";

export default function PerformanceSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        revealIntro(root.current!);
        const frame = q("[data-frame]")[0];

        // Image is unmasked from the right as it travels up the viewport…
        gsap.fromTo(
          frame,
          { clipPath: "inset(0% 0% 0% 100%)" },
          { clipPath: "inset(0% 0% 0% 0%)", ease: "power1.inOut", scrollTrigger: { trigger: frame, start: "top 92%", end: "top 30%", scrub: 0.5 } },
        );
        // …while the photo inside settles from a tight crop and drifts against the scroll.
        gsap.fromTo(
          q("[data-media]"),
          { scale: 1.28, yPercent: -5 },
          { scale: 1.04, yPercent: 5, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.5 } },
        );
        gsap.fromTo(
          q("[data-glow]"),
          { autoAlpha: 0 },
          { autoAlpha: 1, ease: "none", scrollTrigger: { trigger: frame, start: "top 60%", end: "center center", scrub: 0.5 } },
        );
        gsap.fromTo(
          q("[data-num]"),
          { yPercent: 35 },
          { yPercent: -35, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } },
        );
      });
    },
    { scope: root },
  );

  return (
    <section
      id="performance"
      ref={root}
      tabIndex={-1}
      aria-labelledby="performance-title"
      className="relative overflow-hidden border-t border-paper/[0.06] bg-ink py-24 outline-none md:py-36"
    >
      <div className="grid items-center gap-14 md:grid-cols-12 md:gap-0">
        <SectionIntro
          className="z-10 px-[var(--gutter)] md:col-span-5"
          index="01"
          eyebrow="Performance"
          title={["Power", "in motion"]}
          headingId="performance-title"
          copy="Engineered for precision. Designed for those who never settle. Every detail is built to perform beyond limits."
        >
          <a
            data-fade
            href="#engineering"
            onClick={(e) => {
              e.preventDefault();
              scrollToTarget("#engineering");
            }}
            className="btn-line mt-10"
          >
            Discover performance <span aria-hidden className="arrow">↗</span>
          </a>
        </SectionIntro>

        <figure className="relative md:col-span-7 md:pr-[var(--gutter)]">
          <div data-frame className="relative aspect-[4/3] overflow-hidden md:aspect-[16/11]">
            <div data-media className="absolute inset-0 will-change-transform">
              <Image
                src={IMAGES.rearSunset.src}
                alt={IMAGES.rearSunset.alt}
                fill
                sizes="(min-width: 768px) 60vw, 100vw"
                className="object-cover object-[72%_50%]"
              />
            </div>
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgb(5_5_5/0.75),transparent_35%),linear-gradient(0deg,rgb(5_5_5/0.6),transparent_40%)]" />
            <div
              aria-hidden
              data-glow
              className="absolute inset-0 bg-[radial-gradient(ellipse_45%_30%_at_75%_22%,rgb(255_38_59/0.22),transparent_70%)] opacity-0"
            />
            <span aria-hidden className="absolute left-5 top-5 size-4 border-l border-t border-paper/40" />
            <span aria-hidden className="absolute bottom-5 right-5 size-4 border-b border-r border-paper/40" />
          </div>
          <figcaption className="t-micro mt-4 flex justify-between px-[var(--gutter)] text-muted md:px-0">
            <span>Rear three-quarter</span>
            <span>Sundown · Wet asphalt</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
