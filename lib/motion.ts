"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, useGSAP);

export { gsap, ScrollTrigger, useGSAP };

/** Media queries shared by every gsap.matchMedia() call. */
export const MQ = {
  desktop: "(min-width: 768px)",
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
} as const;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia(MQ.reduce).matches;

/**
 * Smooth in-page navigation. Uses GSAP's ScrollToPlugin (instead of CSS
 * `scroll-behavior`) so it cooperates with ScrollTrigger pin spacers, and
 * stops immediately if the user takes over the scroll.
 */
export function scrollToTarget(hash: string, opts: { duration?: number } = {}) {
  const el = hash === "#home" ? null : document.querySelector<HTMLElement>(hash);
  if (hash !== "#home" && !el) return;

  const destination = el ? el.getBoundingClientRect().top + window.scrollY : 0;
  const distance = Math.abs(destination - window.scrollY);
  const duration = prefersReducedMotion()
    ? 0
    : (opts.duration ?? gsap.utils.clamp(0.9, 2.6, 0.6 + distance / 3200));

  gsap.to(window, {
    scrollTo: { y: destination, autoKill: true },
    duration,
    ease: "power2.inOut",
    overwrite: "auto",
    onComplete: () => {
      history.replaceState(null, "", hash === "#home" ? location.pathname + location.search : hash);
      el?.focus({ preventScroll: true });
    },
  });
}

/**
 * Standard editorial reveal used by every content section: masked heading
 * lines rise into place, supporting elements fade up, the crimson accent
 * draws in. Elements are located via data attributes inside `scope`.
 */
export function revealIntro(scope: Element, start = "top 72%") {
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
