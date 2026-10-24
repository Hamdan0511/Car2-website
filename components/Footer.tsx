"use client";

import Image from "next/image";
import { useRef } from "react";
import RedlineStatus from "@/components/driver/RedlineStatus";
import { MQ, revealIntro, scrollToTarget, useMotion } from "@/lib/motion";
import { IMAGES, SECTION_LINKS } from "@/lib/site";

export default function Footer() {
  const root = useRef<HTMLElement>(null);

  // Queued after the hero, one component per frame, once GSAP has loaded (lib/motion).
  useMotion(root, ({ gsap, q }) => {
    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      revealIntro(gsap, q("[data-head]")[0], "top 80%");
      const stage = q("[data-stage]")[0];
      gsap
        .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: stage, start: "top bottom", end: "bottom bottom", scrub: 0.5 } })
        .fromTo(q("[data-car]"), { scale: 1.35, yPercent: 12 }, { scale: 1, yPercent: 0, duration: 1 }, 0)
        .fromTo(q("[data-haze]"), { autoAlpha: 0.2 }, { autoAlpha: 1, duration: 1 }, 0);
      gsap.fromTo(
        q("[data-wordmark] span"),
        { yPercent: 100 },
        { yPercent: 0, stagger: 0.08, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: q("[data-wordmark]")[0], start: "top 95%", toggleActions: "play none none reverse" } },
      );
    });
  });

  return (
    <footer ref={root} className="relative overflow-hidden bg-ink">
      <section id="redline" tabIndex={-1} aria-labelledby="redline-title" data-stage className="relative flex min-h-svh flex-col outline-none">
        <div data-haze aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_55%,rgb(120_8_18/0.55),transparent_75%)]" />
        <div aria-hidden className="absolute inset-0 overflow-hidden">
          <div data-car className="absolute left-1/2 top-[66%] aspect-[2171/724] w-[230vw] -ml-[115vw] -mt-[38vw] md:w-[118vw] md:-ml-[59vw] md:-mt-[19.5vw]">
            <Image src={IMAGES.redline.src} alt="" fill sizes="(min-width: 768px) 118vw, 230vw" className="object-cover" />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--color-ink)_0%,rgb(5_5_5/0.75)_25%,transparent_50%,transparent_75%,var(--color-ink)_100%)]" />
        </div>

        <div data-head className="relative z-10 px-[var(--gutter)] pt-28 text-center md:pt-36">
          <p data-fade className="t-eyebrow flex items-center justify-center gap-4">
            <span aria-hidden data-accent className="block h-px w-10 origin-left bg-crimson" />
            Redline
            <span aria-hidden data-accent className="block h-px w-10 origin-right bg-crimson" />
          </p>
          <h2 id="redline-title" className="t-display mt-6 text-[clamp(1.9rem,5.4vw,5.6rem)]">
            <span className="line-mask"><span data-line className="block">Built to be</span></span>
            <span className="line-mask"><span data-line className="block">different.</span></span>
          </h2>
          <p data-fade className="t-copy mx-auto mt-6">Every line. Every detail. Every moment.</p>
        </div>

        <div className="relative z-10 mt-auto flex justify-center pb-12">
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              scrollToTarget("#home", { duration: 2.4 });
            }}
            className="group flex flex-col items-center gap-4"
          >
            <span className="grid size-14 place-items-center rounded-full border border-paper/30 transition-colors duration-500 group-hover:border-crimson group-hover:bg-crimson/10">
              <svg aria-hidden width="12" height="16" viewBox="0 0 12 16">
                <path d="M6 15V2M1 7l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="1.1" className="text-paper" />
              </svg>
            </span>
            <span className="t-micro text-paper/80">Return to top</span>
          </a>
        </div>
      </section>

      <div className="relative border-t border-paper/10 px-[var(--gutter)] pb-8 pt-14">
        {/* Driver journey status: below the final shot, never over the car. */}
        <RedlineStatus />
        <p data-wordmark aria-hidden className="flex justify-between overflow-hidden text-[clamp(4.5rem,21vw,22rem)] font-extralight leading-[0.85] text-paper/90">
          {"FIZZ".split("").map((l, i) => (
            <span key={i} className="block">
              {l}
            </span>
          ))}
        </p>
        <div className="mt-12 flex flex-col gap-8 border-t border-paper/10 pt-8 md:flex-row md:items-start md:justify-between">
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-8 gap-y-3">
              {SECTION_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToTarget(link.href);
                    }}
                    className="t-micro text-silver/60 transition-colors hover:text-paper"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="t-micro max-w-md space-y-2 leading-relaxed text-muted md:text-right">
            <p>© 2026 FIZZ — a concept automotive experience.</p>
            <p>FIZZ is a fictional brand. All figures are illustrative.</p>
            <p>Built with Next.js, Tailwind CSS &amp; GSAP ScrollTrigger.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
