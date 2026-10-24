"use client";

import { useEffect, type ReactNode } from "react";
import { loadMotion, scrollToTarget, whenMotionReady } from "@/lib/motion";

/**
 * Wraps the page. Its effect runs after every child's, so all components have
 * queued their motion setup by the time it registers the waiter below.
 */
export default function MotionRoot({ children }: { children: ReactNode }) {
  useEffect(() => {
    void loadMotion(); // start fetching GSAP as soon as the page is interactive

    let cancelled = false;
    // Sampled now, before any queued section is measured.
    const fontsPending = document.fonts.status !== "loaded";
    // Wait until the queued sections exist (their pin spacers move
    // everything below them), then resolve a deep link such as /#gallery.
    const cancelReady = whenMotionReady(({ ScrollTrigger }) => {
      document.fonts.ready.then(() => {
        if (cancelled) return;
        // A full refresh re-measures every pin, so only pay for it when a
        // late webfont swap could actually have changed text heights.
        if (fontsPending) ScrollTrigger.refresh();
        if (location.hash.length > 1) scrollToTarget(location.hash, { duration: 0 });
      });
    });
    return () => {
      cancelled = true;
      cancelReady();
    };
  }, []);

  return <>{children}</>;
}
