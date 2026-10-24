"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MQ, scrollToTarget, useMotion } from "@/lib/motion";
import { SkipIntro, StartExperience } from "@/components/driver/IntroControls";
import { IMAGES } from "@/lib/site";

const METRICS = [
  { value: 95, label: "Performance" },
  { value: 80, label: "Innovation" },
  { value: 90, label: "Experience" },
];

// HUD stages. Each one starts at the timeline label of the same name, so the
// readout is derived from the animation itself and can never drift from it.
const STAGES = [
  { key: "A", name: "Arrival", label: "arrival" },
  { key: "B", name: "Immersion", label: "immersion" },
  { key: "C", name: "Detail", label: "detail" },
  { key: "D", name: "Transition", label: "transition" },
  { key: "E", name: "Release", label: "release" },
];
const FRAMES = 240;

// Callouts positioned in % of the opposite-angle photo (fizz-silver-front).
const DETAIL_NOTES = [
  { label: "LED signature", x: 55.6, y: 49, side: "right" },
  { label: "Forged wheel", x: 44, y: 63, side: "left" },
  { label: "Side intake", x: 29.5, y: 44, side: "left" },
  { label: "Carbon splitter", x: 67, y: 75, side: "left" },
] as const;

// Matches the .shot-media geometry in globals.css (band on phones and
// portrait tablets, over-scanned frame elsewhere).
const SHOT_SIZES = "(max-width: 767px) 170vw, (orientation: portrait) and (max-width: 1180px) 130vw, 110vw";

type ShotStyle = CSSProperties & Record<"--ar" | "--cx" | "--fx", number>;

export default function ScrollCarExperience() {
  const root = useRef<HTMLElement>(null);
  // Rendered pin spacer: ScrollTrigger pins inside it instead of re-parenting the
  // section into a generated wrapper. Re-parenting restarts CSS animations
  // (the opening sequence) and moves React-managed nodes behind React's back.
  const spacer = useRef<HTMLDivElement>(null);
  // The second camera angle isn't seen until the cut (~¼ into the scroll), so its
  // download waits until the page has loaded instead of competing with the hero
  // photo (the LCP element) and the JS bundles. The first scroll requests it at once.
  const [angleBReady, setAngleBReady] = useState(false);

  useEffect(() => {
    let idle = 0;
    const ready = () => setAngleBReady(true);
    const schedule = () => {
      idle = window.requestIdleCallback ? window.requestIdleCallback(ready, { timeout: 1500 }) : window.setTimeout(ready, 300);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    window.addEventListener("scroll", ready, { once: true, passive: true });
    return () => {
      window.removeEventListener("load", schedule);
      window.removeEventListener("scroll", ready);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      window.clearTimeout(idle);
    };
  }, []);

  // Ahead of every section in the setup queue (lib/motion); runs once GSAP has loaded.
  useMotion(root, ({ gsap, q }) => {
    const mm = gsap.matchMedia();
    // Measure the pinned section itself, not window.innerHeight: it is
    // h-svh with a min-height, and the two diverge on mobile browsers.
    const stageH = () => root.current?.offsetHeight ?? window.innerHeight;
    const stageW = () => root.current?.offsetWidth ?? window.innerWidth;

    /* ------------------------------------------------------------
       1. INTRO — runs in CSS from first paint (globals.css, "Opening
       sequence"). JS only adds the metric count-up, and only if it can
       still start in sync: the delay is read from each rule's CSS
       animation, so the timing has a single source of truth.
    ------------------------------------------------------------- */
    mm.add(MQ.motion, () => {
      q("[data-count]").forEach((el, i) => {
        const anim = el.closest("li")?.querySelector("[data-intro='rule']")?.getAnimations?.()[0];
        const delay = Number(anim?.effect?.getTiming().delay ?? 0);
        const remaining = delay - Number(anim?.currentTime ?? Infinity);
        if (!(remaining > 50)) return; // hydrated too late: keep the final value
        gsap.fromTo(
          el,
          { textContent: 0 },
          { textContent: METRICS[i].value, snap: { textContent: 1 }, duration: 1.4, ease: "power2.out", delay: remaining / 1000 },
        );
      });
    });

    /* ------------------------------------------------------------
       2. SCROLL — one pinned, scrubbed timeline. Its progress is a
       pure function of scroll position: stop and it holds, scroll
       back and it reverses. Units are arbitrary (total ≈ 10).
       The hero precedes every section in the setup queue, so its pin spacer exists
       before any section below it is measured.
    ------------------------------------------------------------- */
    mm.add({ desktop: MQ.desktop, motion: MQ.motion }, (ctx) => {
      if (!ctx.conditions?.motion) return;
      const desktop = Boolean(ctx.conditions.desktop);

      const frameEl = q("[data-frame-count]")[0];
      const viewEl = q("[data-view]")[0];
      const stageEls = q("[data-stage]");
      let stageAt: number[] = [];
      let cutAt = 1;
      let lastStage = -1;
      let lastView = "";

      const syncHud = (p: number) => {
        frameEl.textContent = String(Math.round(p * FRAMES)).padStart(3, "0");
        let stage = 0;
        stageAt.forEach((at, i) => p >= at && (stage = i));
        if (stage !== lastStage) {
          lastStage = stage;
          stageEls.forEach((el, i) => el.toggleAttribute("data-current", i === stage));
        }
        // The camera label changes once the wipe has crossed mid-frame.
        const view = p >= cutAt ? "Front 3/4 · Right" : "Front 3/4 · Left";
        if (view !== lastView) viewEl.textContent = lastView = view;
      };

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${Math.round(stageH() * (desktop ? 3.4 : 2.6))}`,
          pin: true,
          pinSpacer: spacer.current,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
        onUpdate: () => syncHud(tl.progress()),
      });

      // Push-in limits are deliberately modest: the sources are 724 px tall.
      const pushA = desktop ? 1.16 : 1.2;

      tl.addLabel("arrival", 0)
        .to(q("[data-out='indicator']"), { autoAlpha: 0, y: 24, duration: 0.5 }, 0)

        // STAGE B — IMMERSION: the camera pushes in, the copy clears the frame.
        .addLabel("immersion", 0.5)
        .to(q("[data-shot-media='a']"), { scale: pushA, xPercent: desktop ? -4 : 0, yPercent: 1.5, duration: 2.6 }, 0)
        .to(q("[data-out='eyebrow']"), { autoAlpha: 0, y: -30, duration: 0.8 }, 0.5)
        .to(q("[data-out='hl1']"), { xPercent: -14, autoAlpha: 0, duration: 1.4 }, 0.6)
        .to(q("[data-out='hl2']"), { xPercent: -8, autoAlpha: 0, duration: 1.4 }, 0.8)
        .to(q("[data-out='support']"), { autoAlpha: 0, y: -20, duration: 0.8 }, 0.7)
        .to(q("[data-out='metric']"), { autoAlpha: 0, y: 40, stagger: 0.18, duration: 0.9 }, 0.9)
        .to(q("[data-veil='text']"), { autoAlpha: 0, duration: 1.4 }, 1.0)
        // The light changes before the cut: the warm bloom fades and the
        // exposure dips slightly, as if the camera is leaving the sun.
        .to(q("[data-light='amber']"), { autoAlpha: 0.2, duration: 1.8 }, 0.8)
        .to(q("[data-light='dark']"), { autoAlpha: 0.3, duration: 1.2 }, 1.4)

        // STAGE C — DETAIL: a crimson edge sweeps the second angle in.
        .addLabel("detail", 2.4)
        // The outgoing shot keeps travelling, faster than before (whip-pan feel).
        .to(q("[data-shot-media='a']"), { scale: pushA + 0.04, xPercent: desktop ? -9 : -5, duration: 1.6, ease: "power1.in" }, 2.4)
        .fromTo(
          q("[data-shot='b']"),
          { clipPath: "inset(0% 0% 0% 100%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "power2.inOut" },
          2.4,
        )
        .fromTo(q("[data-wipe]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, 2.4)
        .fromTo(q("[data-wipe]"), { x: stageW }, { x: 0, duration: 1.6, ease: "power2.inOut" }, 2.4)
        .to(q("[data-wipe]"), { autoAlpha: 0, duration: 0.35 }, 3.75)
        .addLabel("cut", 3.2)
        // The incoming shot arrives slightly closer and drifts to rest.
        .fromTo(q("[data-shot-media='b']"), { scale: 1.12, xPercent: 6 }, { scale: 1, xPercent: 0, duration: 3.0, ease: "power2.out" }, 2.4)
        .to(q("[data-light='dark']"), { autoAlpha: 0, duration: 1.2 }, 3.0)
        .fromTo(q("[data-caption]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 3.95)
        .fromTo(q("[data-caption] [data-line]"), { yPercent: 115 }, { yPercent: 0, stagger: 0.12, duration: 0.9 }, 4.0)
        // Callouts appear only once the photo has (nearly) settled on its features.
        .fromTo(q("[data-note-line]"), { scaleX: 0 }, { scaleX: 1, stagger: 0.15, duration: 0.6 }, 4.7)
        .fromTo(q("[data-note]"), { autoAlpha: 0 }, { autoAlpha: 1, stagger: 0.15, duration: 0.5 }, 4.7)
        .to(q("[data-note]"), { autoAlpha: 0, stagger: 0.05, duration: 0.5 }, 6.0)
        .to(q("[data-caption]"), { autoAlpha: 0, y: -24, duration: 0.7 }, 6.0)

        // STAGE D — TRANSITION: the light turns from dusk to crimson.
        .addLabel("transition", 6.4)
        .to(q("[data-shot-media='b']"), { scale: 1.06, xPercent: -2.5, duration: 2.6 }, 6.4)
        .to(q("[data-light='amber']"), { autoAlpha: 0, duration: 1.4 }, 6.4)
        .to(q("[data-light='dark']"), { autoAlpha: 0.45, duration: 2 }, 6.4)
        .to(q("[data-light='red']"), { autoAlpha: 1, duration: 2 }, 6.5)
        .fromTo(q("[data-next]"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 7.5)

        // STAGE E — RELEASE: the letterbox closes to a crimson slit, then the pin lets go.
        .addLabel("release", 8.2)
        .to(q("[data-frame]"), { clipPath: "inset(44% 0% 44% 0%)", duration: 1.5, ease: "power2.inOut" }, 8.2)
        .fromTo(q("[data-bar='top']"), { y: 0, autoAlpha: 0 }, { y: () => stageH() * 0.44, autoAlpha: 1, duration: 1.5, ease: "power2.inOut" }, 8.2)
        .fromTo(q("[data-bar='bottom']"), { y: 0, autoAlpha: 0 }, { y: () => stageH() * -0.44, autoAlpha: 1, duration: 1.5, ease: "power2.inOut" }, 8.2)
        .to(q("[data-light='red']"), { autoAlpha: 0.35, duration: 1.2 }, 8.6)
        .to(q("[data-hud]"), { autoAlpha: 0, duration: 0.6 }, 8.8)
        .to({}, { duration: 0.3 }); // short hold on the final frame before release

      tl.fromTo(q("[data-progress-rail]"), { scaleY: 0 }, { scaleY: 1, duration: tl.duration() }, 0);
      stageAt = STAGES.map((s) => tl.labels[s.label] / tl.duration());
      cutAt = tl.labels.cut / tl.duration();
      syncHud(tl.progress());
    });
  });

  const shot = (ar: number, cx: number, fx: number): ShotStyle => ({ "--ar": ar, "--cx": cx, "--fx": fx });

  return (
    <div ref={spacer}>
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
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_66%_52%,rgb(231_165_107/0.18),transparent_70%)]"
        />

        {/* ---------- Frame: holds both camera angles; closes into a letterbox at release ---------- */}
        <div data-frame className="absolute inset-0 [clip-path:inset(0%_0%_0%_0%)]">
          <div data-intro="shot" data-shot="a" className="shot">
            <div data-shot-media="a" className="shot-media" style={shot(1860 / 724, 0.53, 0.58)}>
              <Image src={IMAGES.heroSilver.src} alt={IMAGES.heroSilver.alt} fill loading="eager" fetchPriority="high" quality={85} sizes={SHOT_SIZES} className="object-cover" />
            </div>
          </div>

          <div data-shot="b" className="shot [clip-path:inset(0%_0%_0%_100%)]" aria-hidden>
            <div data-shot-media="b" className="shot-media" style={shot(2172 / 724, 0.52, 0.56)}>
              {angleBReady && (
                <Image src={IMAGES.silverFront.src} alt="" fill loading="eager" quality={85} sizes={SHOT_SIZES} className="object-cover" />
              )}
              {DETAIL_NOTES.map((n) => (
                <div key={n.label} data-note className="absolute z-[2] hidden md:block" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
                  <div className={`absolute top-0 flex items-center gap-3 ${n.side === "right" ? "left-0" : "right-0 flex-row-reverse"}`}>
                    <span className="callout-dot -my-[4.5px] shrink-0" />
                    <span data-note-line className={`block h-px w-16 bg-paper/60 ${n.side === "right" ? "origin-left" : "origin-right"}`} />
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
            className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_62%,rgb(255_38_59/0.22),transparent_70%)] opacity-0"
          />
          <div
            data-veil="text"
            className="absolute inset-0 bg-[linear-gradient(90deg,rgb(5_5_5/0.88)_0%,rgb(5_5_5/0.55)_30%,transparent_58%)] max-md:bg-[linear-gradient(180deg,rgb(5_5_5/0.9)_0%,rgb(5_5_5/0.5)_32%,transparent_48%)]"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(5_5_5/0.7)_100%)]" />
        </div>

        {/* Crimson edge leading the cut between angles, with a soft light spill trailing onto the new shot. */}
        <div aria-hidden data-wipe className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[18vw] opacity-0">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(255_38_59/0.11),rgb(255_38_59/0.03)_45%,transparent)]" />
          <div className="absolute inset-y-0 left-0 w-px bg-crimson shadow-[0_0_24px_4px_rgb(255_38_59/0.55)]" />
        </div>

        {/* Intro letterbox hairlines (CSS, time-based; separate from the scroll-driven release bars).
            Each is a half-height layer with the line on its inner edge, so translateY(±100%)
            carries the line exactly to the frame edge at any viewport size. */}
        <div aria-hidden data-intro-bar="top" className="pointer-events-none absolute inset-x-0 top-0 z-30 h-1/2 opacity-0">
          <span className="absolute inset-x-0 bottom-0 h-px bg-crimson/80 shadow-[0_0_14px_1px_rgb(255_38_59/0.5)]" />
        </div>
        <div aria-hidden data-intro-bar="bottom" className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-1/2 opacity-0">
          <span className="absolute inset-x-0 top-0 h-px bg-crimson/80 shadow-[0_0_14px_1px_rgb(255_38_59/0.5)]" />
        </div>

        {/* ---------- Hero copy ---------- */}
        <div className="relative z-20 flex h-full flex-col px-[var(--gutter)] pt-[max(6.5rem,16svh)] pb-8 md:pt-[max(7.5rem,17svh)] md:pb-10">
          <div data-out="eyebrow">
            <p data-intro="eyebrow" className="t-eyebrow flex items-center gap-4">
              <span aria-hidden className="h-px w-8 bg-crimson" />A new era begins
            </p>
          </div>

          <h1 id="hero-title" className="t-display mt-6 text-[clamp(2.35rem,6.6vw,7rem)] md:mt-8">
            <span data-out="hl1" className="line-mask">
              <span data-intro="line" className="block" style={{ "--i": 0 } as CSSProperties}>Welcome</span>
            </span>
            <span data-out="hl2" className="line-mask">
              <span data-intro="line" className="block" style={{ "--i": 1 } as CSSProperties}>Itz Fizz</span>
            </span>
          </h1>

          <div data-out="support">
            <p data-intro="support" className="t-copy mt-6 md:mt-8">
              Performance. Innovation. Experience.
              <br />
              Built for those who move different.
            </p>
          </div>

          {/* Phones: this row sits just above the metrics, clear of the car band. */}
          <div data-out="indicator" className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 max-md:mt-auto md:mt-12">
            <a
              href="#performance"
              data-intro="indicator"
              onClick={(e) => {
                e.preventDefault();
                scrollToTarget("#performance", { duration: 4.2 });
              }}
              className="group inline-flex items-center gap-5 max-md:hidden"
            >
              <span className="relative grid size-12 place-items-center rounded-full border border-paper/30 transition-colors duration-500 group-hover:border-crimson">
                <svg aria-hidden width="12" height="16" viewBox="0 0 12 16" className="animate-[fizz-nudge_2.4s_var(--ease-cine)_infinite] motion-reduce:animate-none">
                  <path d="M6 1v13M1 9l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.1" className="text-paper" />
                </svg>
              </span>
              <span className="t-micro text-paper/80">Scroll to explore</span>
            </a>
            <div data-intro="indicator">
              <StartExperience />
            </div>
          </div>

          <ul aria-label="Illustrative brand metrics" className="grid max-md:mt-6 md:mt-auto grid-cols-3 gap-4 md:ml-[18vw] md:max-w-3xl md:gap-14">
            {METRICS.map((m, i) => (
              <li key={m.label} data-out="metric">
                <div data-intro="metric" style={{ "--i": i } as CSSProperties}>
                  <p className="text-[clamp(1.6rem,2.8vw,2.6rem)] font-light tracking-[0.04em] text-paper tabular-nums">
                    <span data-count>{m.value}</span>%
                  </p>
                  <span aria-hidden data-intro="rule" style={{ "--i": i } as CSSProperties} className="mt-2 block h-px w-full origin-left bg-gradient-to-r from-crimson via-crimson/60 to-transparent" />
                  <p className="t-micro mt-3 text-silver/70">{m.label}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <SkipIntro />

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
                  <li key={s.key} data-stage className="t-micro flex gap-4 text-silver/35 transition-colors duration-500 data-[current]:text-paper">
                    <span className="text-crimson/80">{s.key}</span>
                    {s.name}
                  </li>
                ))}
              </ol>
            </div>
            <div className="t-micro absolute bottom-10 right-[var(--gutter)] hidden text-right text-silver/50 lg:block">
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
    </div>
  );
}
