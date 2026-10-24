"use client";

import { deriveStats, MISSIONS } from "@/lib/driver";
import { driver, useDriver } from "@/lib/driverStore";

/** The final scene's link to the driver journey: invitation, progress, or the card. */
export default function RedlineStatus() {
  const { progress, hydrated } = useDriver();
  const s = deriveStats(progress);
  if (!hydrated) return null;

  return (
    <div data-needs-js className="mx-auto mb-14 flex max-w-md flex-col items-center gap-5 text-center">
      {!progress.started ? (
        <>
          <p className="text-sm leading-relaxed text-silver/75">
            Earn your REDLINE: complete five missions across the site and unlock a personal driver card.
          </p>
          <button
            type="button"
            onClick={() => {
              driver.start();
              driver.openPanel("missions");
            }}
            className="btn-line"
          >
            Start driver experience <span aria-hidden className="arrow">↗</span>
          </button>
        </>
      ) : s.redline ? (
        <>
          <p className="t-micro text-crimson">Redline unlocked</p>
          <button type="button" onClick={() => driver.openPanel("card")} className="btn-line border-crimson/70">
            View your driver card <span aria-hidden className="arrow">↗</span>
          </button>
        </>
      ) : (
        <>
          <p className="t-micro text-silver/80">
            Redline locked · <span className="text-crimson">{s.missionsDone}/{s.missionsTotal}</span> missions
          </p>
          <ol aria-label="Mission progress" className="flex gap-2">
            {MISSIONS.map((m) => {
              const done = progress.missions.includes(m.id);
              return (
                <li key={m.id} className={`h-px w-8 ${done ? "bg-crimson" : "bg-paper/20"}`}>
                  <span className="sr-only">
                    {m.title}: {done ? "complete" : "not yet complete"}
                  </span>
                </li>
              );
            })}
          </ol>
          <button type="button" onClick={() => driver.openPanel("missions")} className="btn-line">
            Mission panel <span aria-hidden className="arrow">↗</span>
          </button>
        </>
      )}
    </div>
  );
}
