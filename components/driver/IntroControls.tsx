"use client";

import { useEffect, useState } from "react";
import { driver, skipIntro, useDriver } from "@/lib/driverStore";
import { prefersReducedMotion, scrollToTarget } from "@/lib/motion";

const START_ID = "start-experience";

/** "Start experience": begins the driver journey and drives through the hero. */
export function StartExperience() {
  const { progress } = useDriver();

  if (progress.started) {
    return (
      <button type="button" id={START_ID} data-needs-js onClick={() => driver.openPanel("missions")} className="btn-line">
        Mission panel <span aria-hidden className="arrow">↗</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      id={START_ID}
      data-needs-js
      onClick={() => {
        driver.start();
        skipIntro();
        // Reduced motion: no automatic camera drive — show the missions instead.
        if (prefersReducedMotion()) driver.openPanel("missions");
        else scrollToTarget("#performance", { duration: 4.2 });
      }}
      className="btn-line"
    >
      Start experience <span aria-hidden className="arrow">↗</span>
    </button>
  );
}

/**
 * "Skip intro": present from the first frame; finishes the CSS opening in
 * place (no restart) and removes itself once the opening has ended.
 */
export function SkipIntro() {
  const [running, setRunning] = useState(true);

  useEffect(() => {
    const finite = document
      .getAnimations()
      .filter(
        (a) =>
          "animationName" in a &&
          String((a as CSSAnimation).animationName).startsWith("fizz-") &&
          a.effect?.getComputedTiming().iterations !== Infinity,
      );
    let alive = true;
    Promise.allSettled(finite.map((a) => a.finished)).then(() => alive && setRunning(false));
    return () => {
      alive = false;
    };
  }, []);

  if (!running) return null;

  return (
    <button
      type="button"
      data-needs-js
      onClick={() => {
        skipIntro();
        document.getElementById(START_ID)?.focus();
      }}
      className="t-micro absolute right-[var(--gutter)] top-[4.75rem] z-40 min-h-11 px-1 text-silver/70 transition-colors hover:text-paper md:top-[5.75rem]"
    >
      Skip intro <span aria-hidden>→</span>
    </button>
  );
}
