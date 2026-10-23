"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, MQ, revealIntro, useGSAP } from "@/lib/motion";
import { IMAGES } from "@/lib/site";

const PLATES = [
  { image: IMAGES.heroSilver, title: "Front three-quarter", meta: "Salt flat · Dusk", span: "md:col-span-8", frame: "aspect-[16/10]", position: "object-[56%_50%]" },
  { image: IMAGES.rearSunset, title: "Rear haunch", meta: "Sundown · Wet asphalt", span: "md:col-span-4", frame: "aspect-[4/5] md:aspect-auto", position: "object-[58%_50%]" },
  { image: IMAGES.silverFront, title: "Opposite angle", meta: "Alpine lake · Blue hour", span: "md:col-span-5", frame: "aspect-[4/3]", position: "object-[78%_50%]" },
  { image: IMAGES.redline, title: "Plan view", meta: "Redline lighting", span: "md:col-span-7", frame: "aspect-[16/9] md:aspect-auto", position: "object-center" },
];

export default function GallerySection() {
  const root = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        revealIntro(q("[data-head]")[0]);
        q("[data-plate]").forEach((plate) => {
          const clip = plate.querySelector("[data-clip]");
          const media = plate.querySelector("[data-parallax]");
          gsap.fromTo(
            clip,
            { clipPath: "inset(100% 0% 0% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: plate, start: "top 85%", toggleActions: "play none none reverse" } },
          );
          gsap.fromTo(media, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: plate, start: "top bottom", end: "bottom top", scrub: 0.5 } });
        });
      });
    },
    { scope: root },
  );

  const show = useCallback((i: number) => {
    setOpen(i);
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  const step = useCallback((dir: 1 | -1) => setOpen((i) => (i === null ? i : (i + dir + PLATES.length) % PLATES.length)), []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const onClose = () => setOpen(null);
    d.addEventListener("keydown", onKey);
    d.addEventListener("close", onClose);
    return () => {
      d.removeEventListener("keydown", onKey);
      d.removeEventListener("close", onClose);
    };
  }, [step]);

  const current = open === null ? null : PLATES[open];

  return (
    <section
      id="gallery"
      ref={root}
      tabIndex={-1}
      aria-labelledby="gallery-title"
      className="relative bg-ink py-24 outline-none md:py-36"
    >
      <div data-head className="flex flex-col gap-8 px-[var(--gutter)] md:flex-row md:items-end md:justify-between">
        <div>
          <p data-fade className="t-eyebrow flex items-center gap-4">
            <span aria-hidden data-accent className="block h-px w-10 origin-left bg-crimson" />
            Gallery
          </p>
          <h2 id="gallery-title" className="t-display mt-6 text-[clamp(2rem,4.3vw,4.5rem)]">
            <span className="line-mask"><span data-line className="block">Studies</span></span>
            <span className="line-mask"><span data-line className="block">in light</span></span>
          </h2>
        </div>
        <p data-fade className="t-copy md:text-right">Four frames from the FIZZ campaign. Select any plate to view it uncropped.</p>
      </div>

      <ul className="mt-14 grid gap-5 px-[var(--gutter)] md:mt-20 md:grid-cols-12 md:gap-6">
        {PLATES.map((p, i) => (
          <li key={p.title} data-plate className={p.span}>
            <button
              type="button"
              onClick={() => show(i)}
              aria-label={`Open plate 0${i + 1}: ${p.title}`}
              className="group block h-full w-full text-left"
            >
              <div data-clip className={`relative h-full min-h-56 overflow-hidden bg-graphite ${p.frame}`}>
                <div data-parallax className="absolute -inset-y-[8%] inset-x-0">
                  <Image
                    src={p.image.src}
                    alt={p.image.alt}
                    fill
                    sizes="(min-width: 768px) 60vw, 100vw"
                    className={`object-cover ${p.position} transition-[transform,filter] duration-[1400ms] ease-[var(--ease-cine)] brightness-[0.85] group-hover:scale-[1.05] group-hover:brightness-100 group-focus-visible:scale-[1.05]`}
                  />
                </div>
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 md:inset-x-6 md:bottom-6">
                  <div>
                    <p className="t-micro text-crimson">Plate 0{i + 1}</p>
                    <p className="mt-2 text-lg font-light uppercase tracking-[0.2em] text-paper">{p.title}</p>
                    <span aria-hidden className="mt-3 block h-px w-8 bg-paper/50 transition-all duration-700 ease-[var(--ease-cine)] group-hover:w-20 group-hover:bg-crimson" />
                  </div>
                  <p className="t-micro hidden text-silver/70 sm:block">{p.meta}</p>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label={current ? `Plate 0${(open ?? 0) + 1}: ${current.title}` : "Gallery viewer"}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        className="m-auto max-h-none max-w-none bg-transparent p-0 text-paper backdrop:bg-ink/95"
      >
        {current && (
          <div className="flex w-[94vw] max-w-[1600px] flex-col gap-5">
            <div className="flex items-center justify-between">
              <p className="t-micro">
                <span className="text-crimson">Plate 0{(open ?? 0) + 1}</span>
                <span className="mx-3 text-muted">/</span>
                {current.title} — <span className="text-muted">{current.meta}</span>
              </p>
              <button type="button" autoFocus onClick={() => dialog.current?.close()} className="t-micro px-2 py-2 hover:text-crimson">
                Close ✕
              </button>
            </div>
            <div className="relative aspect-[3/1] w-full bg-graphite">
              <Image key={current.image.src} src={current.image.src} alt={current.image.alt} fill sizes="94vw" className="object-contain" />
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => step(-1)} className="btn-line">
                <span aria-hidden>←</span> Previous
              </button>
              <button type="button" onClick={() => step(1)} className="btn-line">
                Next <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
