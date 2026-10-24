"use client";

import { useEffect } from "react";
import { MISSIONS, type MissionId } from "@/lib/driver";
import { driver, useDriver } from "@/lib/driverStore";

/** How long a section must stay in the middle of the viewport to count as explored. */
const DWELL_MS = 1200;

/**
 * Completes section missions when a section is genuinely explored: it must sit
 * in the middle band of the viewport for DWELL_MS. Works the same for normal
 * scrolling, menu jumps and deep links; fast scroll-throughs don't count.
 * The Gallery mission is completed by opening a plate (GallerySection).
 */
export default function MissionTracker() {
  const { progress } = useDriver();
  const pending = MISSIONS.filter((m) => m.id !== "gallery" && !progress.missions.includes(m.id))
    .map((m) => m.id)
    .join(",");

  useEffect(() => {
    if (!progress.started || !pending) return;
    const timers = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id as MissionId;
          if (entry.isIntersecting && !timers.has(entry.target)) {
            timers.set(entry.target, window.setTimeout(() => driver.completeMission(id), DWELL_MS));
          } else if (!entry.isIntersecting) {
            window.clearTimeout(timers.get(entry.target));
            timers.delete(entry.target);
          }
        }
      },
      { rootMargin: "-35% 0px -35% 0px" },
    );
    pending.split(",").forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => {
      observer.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [progress.started, pending]);

  return null;
}
