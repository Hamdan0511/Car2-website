"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { gsap as GsapCore } from "gsap";
import type { ScrollTrigger as ScrollTriggerClass } from "gsap/ScrollTrigger";

type GsapContext = ReturnType<typeof GsapCore.context>;

/** Media queries shared by every gsap.matchMedia() call. */
export const MQ = {
  desktop: "(min-width: 768px)",
  navInline: "(min-width: 1024px)",
  /** Wide enough for side-by-side, pinned layouts. Mirrors the `wide:` CSS variant. */
  wide: "(min-width: 768px) and (min-aspect-ratio: 1/1)",
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
} as const;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia(MQ.reduce).matches;

/* ---------------------------------------------------------------
   GSAP is loaded on demand, not in the initial bundle. The opening
   sequence is CSS, so nothing above the fold needs GSAP to paint;
   keeping it off the critical path lets the hero photo (the LCP
   element) and hydration finish first. Loading starts at hydration.
---------------------------------------------------------------- */
export type Motion = {
  gsap: typeof GsapCore;
  ScrollTrigger: typeof ScrollTriggerClass;
};

let loading: Promise<Motion> | null = null;

export function loadMotion(): Promise<Motion> {
  loading ??= Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("gsap/ScrollToPlugin")]).then(
    ([core, st, scrollTo]) => {
      core.gsap.registerPlugin(st.ScrollTrigger, scrollTo.ScrollToPlugin);
      // No auto-refresh on window "load": every image sits in a box sized by
      // CSS, so image loading cannot move layout, and a full refresh re-measures
      // every pin (a long main-thread task on mobile). Fonts: see MotionRoot.
      st.ScrollTrigger.config({ ignoreMobileResize: true, autoRefreshEvents: "visibilitychange,DOMContentLoaded,resize" });
      return { gsap: core.gsap, ScrollTrigger: st.ScrollTrigger };
    },
  );
  return loading;
}

/* ---------------------------------------------------------------
   Ordered setup queue. Building every timeline in one React commit
   produced a >1 s main-thread task on throttled mobile CPUs, so each
   component queues its setup instead. Jobs run once GSAP has loaded,
   one per frame, strictly in registration (= page) order, so a pinned
   section's spacer always exists before anything below it is measured.
---------------------------------------------------------------- */
type Job = (m: Motion) => void;
const queue: Job[] = [];
const readyWaiters: Job[] = [];
let draining = false;

// One job per frame: ScrollTriggers attached to timelines take their first
// measurement on the next GSAP tick, so pacing jobs by frame keeps each
// job's deferred measurement in its own frame instead of piling them up.
// (rAF, then a fresh task, so the job runs after that frame's GSAP tick.)
const nextTask = (cb: () => void) => {
  requestAnimationFrame(() => {
    const channel = new MessageChannel();
    channel.port1.onmessage = cb;
    channel.port2.postMessage(null);
  });
};

function drain(m: Motion) {
  const job = queue.shift();
  if (job) {
    job(m);
    nextTask(() => drain(m));
    return;
  }
  draining = false;
  readyWaiters.splice(0).forEach((cb) => cb(m));
}

function startDraining() {
  if (draining) return;
  draining = true;
  loadMotion().then((m) => nextTask(() => drain(m)));
}

/** Queue a setup job. Returns a cancel function for cleanup. */
export function deferMotion(job: Job) {
  let cancelled = false;
  queue.push((m) => {
    if (!cancelled) job(m);
  });
  startDraining();
  return () => {
    cancelled = true;
  };
}

/**
 * Runs `cb` once every queued job has run — i.e. once the page's full
 * scroll height, including pin spacers, exists. Components queue during
 * the same React commit, so a waiter registered by an earlier component
 * still runs after all of them.
 */
export function whenMotionReady(cb: Job) {
  let cancelled = false;
  readyWaiters.push((m) => {
    if (!cancelled) cb(m);
  });
  startDraining();
  return () => {
    cancelled = true;
  };
}

export type MotionScope = Motion & {
  /** Selector scoped to the component's root element. */
  q: (selector: string) => HTMLElement[];
  /** The component's GSAP context; use ctx.add() for animations created later. */
  ctx: GsapContext;
};

/**
 * Component animation setup. Queues `setup` (see above), runs it inside a
 * gsap.context scoped to `scope`, and reverts every tween, ScrollTrigger and
 * matchMedia it created on unmount. `setup` may return a cleanup function.
 */
export function useMotion(scope: RefObject<HTMLElement | null>, setup: (m: MotionScope) => void | (() => void)) {
  // Setup runs once per mount; it must not depend on changing props/state.
  const setupRef = useRef(setup);

  useEffect(() => {
    const el = scope.current;
    if (!el) return;
    let ctx: GsapContext | undefined;
    const cancel = deferMotion((m) => {
      ctx = m.gsap.context((self: GsapContext) => setupRef.current({ ...m, q: m.gsap.utils.selector(el), ctx: self }), el);
    });
    return () => {
      cancel();
      ctx?.revert();
    };
  }, [scope]);
}

/**
 * Smooth in-page navigation. Uses GSAP's ScrollToPlugin (instead of CSS
 * `scroll-behavior`) so it cooperates with ScrollTrigger pin spacers, and
 * stops immediately if the user takes over the scroll. Instant jumps and
 * reduced motion use native scrolling and don't wait for GSAP.
 */
export function scrollToTarget(hash: string, opts: { duration?: number } = {}) {
  // getElementById (not querySelector) so a malformed hash can never throw.
  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {}
  const el = document.getElementById(id);
  if (!el) return;

  // Measured at scroll time. A pinned section reports top: 0 while pinned,
  // so measure its in-flow pin spacer instead — where it really starts.
  const destination = () => {
    if (hash === "#home") return 0;
    const parent = el.parentElement;
    const anchor = parent?.classList.contains("pin-spacer") ? parent : el;
    return anchor.getBoundingClientRect().top + window.scrollY;
  };
  const arrive = () => {
    history.replaceState(null, "", hash === "#home" ? location.pathname + location.search : hash);
    el.focus({ preventScroll: true });
  };

  if (opts.duration === 0 || prefersReducedMotion()) {
    window.scrollTo({ top: destination(), behavior: "instant" });
    arrive();
    return;
  }

  loadMotion().then(({ gsap }) => {
    const y = destination();
    const distance = Math.abs(y - window.scrollY);
    gsap.to(window, {
      scrollTo: { y, autoKill: true },
      duration: opts.duration ?? gsap.utils.clamp(0.9, 2.6, 0.6 + distance / 3200),
      ease: "power2.inOut",
      overwrite: "auto",
      onComplete: arrive,
    });
  });
}

/**
 * Standard editorial reveal used by every content section: masked heading
 * lines rise into place, supporting elements fade up, the crimson accent
 * draws in. Elements are located via data attributes inside `scope`.
 */
export function revealIntro(gsap: Motion["gsap"], scope: Element, start = "top 72%") {
  const q = gsap.utils.selector(scope);
  const tl = gsap.timeline({
    defaults: { ease: "expo.out", duration: 1.2 },
    scrollTrigger: { trigger: scope, start, toggleActions: "play none none reverse" },
  });
  tl.fromTo(q("[data-accent]"), { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power3.inOut" }, 0)
    .fromTo(q("[data-line]"), { yPercent: 110 }, { yPercent: 0, stagger: 0.09 }, 0.1)
    .fromTo(q("[data-fade]"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, stagger: 0.08 }, 0.25);
  return tl;
}
