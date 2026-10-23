"use client";

import Image from "next/image";
import { useRef, type CSSProperties } from "react";
import { gsap, MQ, scrollToTarget, useGSAP } from "@/lib/motion";
import { IMAGES } from "@/lib/site";

const METRICS = [
  { value: 95, label: "Performance" },
  { value: 80, label: "Innovation" },
  { value: 90, label: "Experience" },
];

// Stage boundaries as fractions of the scrubbed timeline (see timeline below).
const STAGES = [
  { key: "A", name: "Arrival", at: 0 },
  { key: "B", name: "Immersion", at: 0.06 },
  { key: "C", name: "Detail", at: 0.26 },
  { key: "D", name: "Transition", at: 0.62 },
  { key: "E", name: "Release", at: 0.82 },
];
const FRAMES = 240;

// Callouts positioned in % of the opposite-angle photo (fizz-silver-front).
const DETAIL_NOTES = [
  { label: "LED signature", x: 55.6, y: 49, side: "right" },
  { label: "Forged wheel", x: 44, y: 63, side: "left" },
  { label: "Side intake", x: 29.5, y: 44, side: "left" },
  { label: "Carbon splitter", x: 67, y: 75, side: "left" },
] as const;

type ShotStyle = CSSProperties & Record<"--ar" | "--cx" | "--fx", number>;

export default function ScrollCarExperience() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      /* ------------------------------------------------------------
         1. INTRO — time-based, plays once on load. It only animates
         inner [data-intro] layers; the scroll timeline drives their
         outer wrappers, so the two never fight over a property.
      ------------------------------------------------------------- */
      mm.add(MQ.motion, () => {
        const intro = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.3 } });
        intro
          // Phase 1 — atmosphere
          .fromTo(q("[data-intro='atmo']"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4, ease: "power2.out" }, 0)
          // Phase 4 — vehicle: the frame opens from a letterbox slit
          .fromTo(
            q("[data-intro='shot']"),
            { autoAlpha: 1, clipPath: "inset(49.5% 0% 49.5% 0%)", scale: 1.12 },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.7, ease: "expo.inOut" },
            0.3,
          )
          .to(q("[data-intro='shot']"), { scale: 1, duration: 2.4, ease: "power3.out" }, 0.55)
          // Phase 3 — typography
          .fromTo(q("[data-intro='eyebrow']"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0 }, 0.5)
          .fromTo(q("[data-intro='line']"), { autoAlpha: 1, yPercent: 115 }, { yPercent: 0, stagger: 0.13, duration: 1.5 }, 0.6)
          // Phase 5 — supporting copy
          .fromTo(q("[data-intro='support']"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0 }, 1.05)
          // Phase 6 — metrics, sequential
          .fromTo(q("[data-intro='metric']"), { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, stagger: 0.16 }, 1.25)
          .fromTo(q("[data-metric-rule]"), { scaleX: 0 }, { scaleX: 1, stagger: 0.16, duration: 1.1, ease: "power3.inOut" }, 1.3)
          .fromTo(
            q("[data-count]"),
            { textContent: 0 },
            { textContent: (i: number) => METRICS[i].value, snap: { textContent: 1 }, stagger: 0.16, duration: 1.4, ease: "power2.out" },
            1.3,
          )
          // Phase 7 — interaction
          .fromTo(q("[data-intro='hud']"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 1.6)
          .fromTo(q("[data-intro='indicator']"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0 }, 1.75);
      });

      /* ------------------------------------------------------------
         2. SCROLL — one pinned, scrubbed timeline. Its progress is a
         pure function of scroll position: stop and it holds, scroll
         back and it reverses. Units are arbitrary (total ≈ 10).
      ------------------------------------------------------------- */
      mm.add({ desktop: MQ.desktop, motion: MQ.motion }, (ctx) => {
        if (!ctx.conditions?.motion) return;
        const desktop = Boolean(ctx.conditions.desktop);

        const frameEl = q("[data-frame-count]")[0];
        const viewEl = q("[data-view]")[0];
        const stageEls = q("[data-stage]");
        let lastStage = -1;

        const syncHud = (p: number) => {
          frameEl.textContent = String(Math.round(p * FRAMES)).padStart(3, "0");
          let stage = 0;
          STAGES.forEach((s, i) => p >= s.at && (stage = i));
          if (stage === lastStage) return;
          lastStage = stage;
          stageEls.forEach((el, i) => el.toggleAttribute("data-current", i === stage));
          viewEl.textContent = stage >= 2 ? "Front 3/4 · Right" : "Front 3/4 · Left";
        };

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * (desktop ? 3.4 : 2.6))}`,
            pin: true,
            scrub: 0.5,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
          onUpdate: () => syncHud(tl.progress()),
        });

        tl.addLabel("arrival", 0)
          .to(q("[data-out='indicator']"), { autoAlpha: 0, y: 24, duration: 0.5 }, 0)

          // STAGE B — IMMERSION: the camera pushes in, the copy clears the frame.
          .addLabel("immersion", 0.6)
          .to(q("[data-shot-media='a']"), { scale: desktop ? 1.2 : 1.32, xPercent: desktop ? -5 : 0, yPercent: 2, duration: 3.4 }, 0)
          .to(q("[data-out='eyebrow']"), { autoAlpha: 0, y: -30, duration: 0.8 }, 0.5)
          .to(q("[data-out='hl1']"), { xPercent: -14, autoAlpha: 0, duration: 1.4 }, 0.6)
          .to(q("[data-out='hl2']"), { xPercent: -8, autoAlpha: 0, duration: 1.4 }, 0.8)
          .to(q("[data-out='support']"), { autoAlpha: 0, y: -20, duration: 0.8 }, 0.7)
          .to(q("[data-out='metric']"), { autoAlpha: 0, y: 40, stagger: 0.18, duration: 0.9 }, 0.9)
          .to(q("[data-veil='text']"), { autoAlpha: 0, duration: 1.6 }, 1.0)
          .to(q("[data-light='amber']"), { autoAlpha: 0.25, duration: 2 }, 0.6)

          // STAGE C — DETAIL: a crimson wipe cuts to the opposite angle.
          .addLabel("detail", 2.6)
          .fromTo(
            q("[data-shot='b']"),
            { clipPath: "inset(0% 0% 0% 100%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "power2.inOut" },
            2.6,
          )
          .fromTo(q("[data-wipe]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, 2.6)
          .fromTo(q("[data-wipe]"), { x: () => window.innerWidth }, { x: 0, duration: 1.6, ease: "power2.inOut" }, 2.6)
          .to(q("[data-wipe]"), { autoAlpha: 0, duration: 0.3 }, 4.1)
          .fromTo(q("[data-shot-media='b']"), { scale: 1.22, xPercent: 4 }, { scale: 1, xPercent: 0, duration: 3.8 }, 2.6)
          .fromTo(q("[data-caption]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 3.95)
          .fromTo(q("[data-caption] [data-line]"), { yPercent: 115 }, { yPercent: 0, stagger: 0.12, duration: 0.9 }, 4.0)
          .fromTo(q("[data-note-line]"), { scaleX: 0 }, { scaleX: 1, stagger: 0.15, duration: 0.6 }, 4.3)
          .fromTo(q("[data-note]"), { autoAlpha: 0 }, { autoAlpha: 1, stagger: 0.15, duration: 0.5 }, 4.3)
          .to(q("[data-note]"), { autoAlpha: 0, stagger: 0.05, duration: 0.5 }, 5.8)
          .to(q("[data-caption]"), { autoAlpha: 0, y: -24, duration: 0.7 }, 5.9)

          // STAGE D — TRANSITION: the light turns from dusk to crimson.
          .addLabel("transition", 6.2)
          .to(q("[data-shot-media='b']"), { scale: 1.1, xPercent: -3, duration: 2.6 }, 6.4)
          .to(q("[data-light='dark']"), { autoAlpha: 0.5, duration: 2 }, 6.2)
          .to(q("[data-light='red']"), { autoAlpha: 1, duration: 2 }, 6.3)
          .fromTo(q("[data-next]"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 7.4)

          // STAGE E — RELEASE: the letterbox closes to a crimson slit, then the pin lets go.
          .addLabel("release", 8.2)
          .to(q("[data-frame]"), { clipPath: "inset(44% 0% 44% 0%)", duration: 1.5, ease: "power2.inOut" }, 8.2)
          .fromTo(
            q("[data-bar='top']"),
            { y: 0, autoAlpha: 0 },
            { y: () => window.innerHeight * 0.44, autoAlpha: 1, duration: 1.5, ease: "power2.inOut" },
            8.2,
          )
          .fromTo(
            q("[data-bar='bottom']"),
            { y: 0, autoAlpha: 0 },
            { y: () => window.innerHeight * -0.44, autoAlpha: 1, duration: 1.5, ease: "power2.inOut" },
            8.2,
          )
          .to(q("[data-light='red']"), { autoAlpha: 0.35, duration: 1.2 }, 8.6)
          .to(q("[data-hud]"), { autoAlpha: 0, duration: 0.6 }, 8.8)
          .to({}, { duration: 0.3 }); // short hold on the final frame before release

        tl.fromTo(q("[data-progress-rail]"), { scaleY: 0 }, { scaleY: 1, duration: tl.duration() }, 0);
        syncHud(0);
      });
    },
    { scope: root },
  );

  const shot = (ar: number, cx: number, fx: number): ShotStyle => ({ "--ar": ar, "--cx": cx, "--fx": fx });

  return (
    <section
      id="home"
      ref={root}
      tabIndex={-1}
      aria-labelledby="hero-title"
      className="relative h-svh min-h-[34rem] w-full overflow-hidden bg-ink outline-none"
    >
      {/* ---------- Atmosphere (behind the photography) ---------- */}
      <div
        data-intro="atmo"
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_78%_38%,rgb(231_165_107/0.16),transparent_70%)]"
      />

      {/* ---------- Frame: holds both camera angles; closes into a letterbox at release ---------- */}
      <div data-frame className="absolute inset-0 [clip-path:inset(0%_0%_0%_0%)]">
        <div data-intro="shot" data-shot="a" className="shot">
          <div data-shot-media="a" className="shot-media" style={shot(1860 / 724, 0.53, 0.58)}>
            <Image
              src={IMAGES.heroSilver.src}
              alt={IMAGES.heroSilver.alt}
              fill
              preload
              quality={85}
              sizes="(max-width: 767px) 170vw, 125vw"
              className="object-cover"
            />
          </div>
        </div>

        <div data-shot="b" className="shot [clip-path:inset(0%_0%_0%_100%)]" aria-hidden>
          <div data-shot-media="b" className="shot-media" style={shot(2172 / 724, 0.52, 0.56)}>
            <Image src={IMAGES.silverFront.src} alt="" fill loading="eager" quality={85} sizes="(max-width: 767px) 170vw, 125vw" className="object-cover" />
            {DETAIL_NOTES.map((n) => (
              <div key={n.label} data-note className="absolute z-[2] hidden md:block" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
                <div className={`absolute top-0 flex items-center gap-3 ${n.side === "right" ? "left-0" : "right-0 flex-row-reverse"}`}>
                  <span className="callout-dot -my-[4.5px] shrink-0" />
                  <span
                    data-note-line
                    className={`block h-px w-16 bg-paper/60 ${n.side === "right" ? "origin-left" : "origin-right"}`}
                  />
                  <span className="t-micro whitespace-nowrap text-paper [text-shadow:0_1px_12px_rgb(0_0_0/0.95)]">{n.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Lighting & veils ---------- */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          data-light="amber"
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_85%_30%,rgb(231_165_107/0.14),transparent_70%)]"
        />
        <div data-light="dark" className="absolute inset-0 bg-ink opacity-0" />
        <div
          data-light="red"
          className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_62%,rgb(255_38_59/0.28),transparent_70%)] opacity-0"
        />
        <div
          data-veil="text"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgb(5_5_5/0.88)_0%,rgb(5_5_5/0.55)_30%,transparent_58%)] max-md:bg-[linear-gradient(180deg,rgb(5_5_5/0.9)_0%,rgb(5_5_5/0.5)_32%,transparent_48%)]"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(5_5_5/0.7)_100%)]" />
      </div>

      {/* Crimson edge that leads the wipe between angles. */}
      <div aria-hidden data-wipe className="pointer-events-none absolute inset-y-0 left-0 z-20 w-px bg-crimson opacity-0 shadow-[0_0_24px_4px_rgb(255_38_59/0.55)]" />

      {/* ---------- Hero copy ---------- */}
      <div className="relative z-20 flex h-full flex-col px-[var(--gutter)] pt-[max(6.5rem,16svh)] pb-8 md:pt-[max(7.5rem,17svh)] md:pb-10">
        <div data-out="eyebrow">
          <p data-intro="eyebrow" className="t-eyebrow flex items-center gap-4">
            <span aria-hidden className="h-px w-8 bg-crimson" />A new era begins
          </p>
        </div>

        <h1 id="hero-title" className="t-display mt-6 text-[clamp(2.35rem,6.6vw,7rem)] md:mt-8">
          <span data-out="hl1" className="line-mask">
            <span data-intro="line" className="block">Welcome</span>
          </span>
          <span data-out="hl2" className="line-mask">
            <span data-intro="line" className="block">Itz Fizz</span>
          </span>
        </h1>

        <div data-out="support">
          <p data-intro="support" className="t-copy mt-6 md:mt-8">
            Performance. Innovation. Experience.
            <br />
            Built for those who move different.
          </p>
        </div>

        <div data-out="indicator" className="mt-8 max-md:hidden md:mt-12">
          <a
            href="#performance"
            data-intro="indicator"
            onClick={(e) => {
              e.preventDefault();
              scrollToTarget("#performance", { duration: 4.2 });
            }}
            className="group inline-flex items-center gap-5"
          >
            <span className="relative grid size-12 place-items-center rounded-full border border-paper/30 transition-colors duration-500 group-hover:border-crimson">
              <svg aria-hidden width="12" height="16" viewBox="0 0 12 16" className="animate-[fizz-nudge_2.4s_var(--ease-cine)_infinite] motion-reduce:animate-none">
                <path d="M6 1v13M1 9l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.1" className="text-paper" />
              </svg>
            </span>
            <span className="t-micro text-paper/80">Scroll to explore</span>
          </a>
        </div>

        <ul aria-label="Illustrative brand metrics" className="mt-auto grid grid-cols-3 gap-4 md:ml-[18vw] md:max-w-3xl md:gap-14">
          {METRICS.map((m) => (
            <li key={m.label} data-out="metric">
              <div data-intro="metric">
                <p className="text-[clamp(1.6rem,2.8vw,2.6rem)] font-light tracking-[0.04em] text-paper tabular-nums">
                  <span data-count>{m.value}</span>%
                </p>
                <span aria-hidden data-metric-rule className="mt-2 block h-px w-full origin-left bg-gradient-to-r from-crimson via-crimson/60 to-transparent" />
                <p className="t-micro mt-3 text-silver/70">{m.label}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ---------- Caption for the detail stage ---------- */}
      <div data-caption aria-hidden className="pointer-events-none invisible absolute left-[var(--gutter)] top-[max(6.5rem,16svh)] z-20 md:top-[max(7.5rem,17svh)]">
        <p className="t-eyebrow mb-5 text-crimson">Detail · 360°</p>
        <p className="t-display text-[clamp(1.6rem,3.6vw,3.6rem)]">
          <span className="line-mask"><span data-line className="block">Precision</span></span>
          <span className="line-mask"><span data-line className="block">From every angle</span></span>
        </p>
      </div>

      {/* ---------- HUD: makes the scroll ↔ timeline sync visible ---------- */}
      <div data-hud aria-hidden className="pointer-events-none absolute inset-0 z-30 motion-reduce:hidden">
        <div data-intro="hud" className="absolute inset-0">
          <div className="absolute right-[var(--gutter)] top-[max(7.5rem,17svh)] hidden pl-5 md:block">
            <span className="absolute inset-y-0 left-0 w-px bg-paper/15">
              <span data-progress-rail className="block h-full w-full origin-top bg-crimson" />
            </span>
            <ol className="flex flex-col gap-5">
              {STAGES.map((s) => (
                <li
                  key={s.key}
                  data-stage
                  className="t-micro flex gap-4 text-silver/35 transition-colors duration-500 data-[current]:text-paper"
                >
                  <span className="text-crimson/80">{s.key}</span>
                  {s.name}
                </li>
              ))}
            </ol>
          </div>
          <div className="t-micro absolute bottom-8 right-[var(--gutter)] hidden text-right text-silver/50 md:bottom-10 md:block">
            <p>
              Frame <span data-frame-count className="text-paper tabular-nums">000</span> / {FRAMES}
            </p>
            <p data-view className="mt-2">Front 3/4 · Left</p>
          </div>
        </div>
      </div>

      {/* ---------- Release: letterbox hairlines and the hand-off label ---------- */}
      <div aria-hidden data-bar="top" className="pointer-events-none absolute inset-x-0 top-0 z-30 h-px bg-crimson opacity-0 shadow-[0_0_18px_2px_rgb(255_38_59/0.6)]" />
      <div aria-hidden data-bar="bottom" className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-px bg-crimson opacity-0 shadow-[0_0_18px_2px_rgb(255_38_59/0.6)]" />
      <p aria-hidden data-next className="t-micro pointer-events-none absolute inset-x-0 top-[calc(56%+2rem)] z-30 text-center text-silver/70 opacity-0">
        Next <span className="mx-3 text-crimson">—</span> 01 Performance
      </p>
    </section>
  );
}
