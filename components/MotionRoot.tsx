"use client";

import type { ReactNode } from "react";
import { ScrollTrigger, scrollToTarget, useGSAP } from "@/lib/motion";

/**
 * Wraps the page. Its layout effect runs after every child's, so by the time
 * it executes all section timelines exist and their intro start-states have
 * been written — only then is CSS intro gating released.
 */
export default function MotionRoot({ children }: { children: ReactNode }) {
  useGSAP(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });
    document.documentElement.classList.add("intro-ready");

    // Webfont swaps change text heights, so re-measure once fonts settle.
    // A deep link (/#gallery) is resolved after that, when pin spacers exist.
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      ScrollTrigger.refresh();
      if (location.hash.length > 1) scrollToTarget(location.hash, { duration: 0 });
    });
    return () => {
      cancelled = true;
    };
  });

  return <>{children}</>;
}
