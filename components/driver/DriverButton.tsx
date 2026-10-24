"use client";

import { deriveStats } from "@/lib/driver";
import { driver, useDriver } from "@/lib/driverStore";

/**
 * Compact driver HUD in the header: a completion gauge plus level and mission
 * count. It never overlays the car or page content; it opens the mission panel.
 */
export default function DriverButton() {
  const { progress } = useDriver();
  const s = deriveStats(progress);
  const r = 9;
  const c = 2 * Math.PI * r;

  const label = progress.started
    ? `Driver panel: level ${s.level.level} ${s.level.name}, ${s.xp} XP, ${s.missionsDone} of ${s.missionsTotal} missions complete${
        s.currentMission ? `. Next: ${s.currentMission.title}` : ""
      }`
    : "Driver experience: open the mission panel to start";

  return (
    <button
      type="button"
      data-needs-js
      onClick={() => driver.openPanel("missions")}
      aria-label={label}
      title={progress.started && s.currentMission ? `Next mission — ${s.currentMission.title}` : undefined}
      className="t-micro relative z-10 flex min-h-11 items-center gap-2.5 rounded-full border border-paper/15 py-1.5 pl-1.5 pr-3.5 text-paper transition-colors duration-500 hover:border-crimson"
    >
      <svg aria-hidden width="26" height="26" viewBox="0 0 26 26" className="-rotate-90">
        <circle cx="13" cy="13" r={r} fill="none" stroke="rgb(245 245 245 / 0.15)" strokeWidth="1.5" />
        <circle
          cx="13"
          cy="13"
          r={r}
          fill="none"
          stroke="var(--color-crimson)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - s.completion / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-[var(--ease-cine)]"
        />
      </svg>
      {progress.started ? (
        <span className="flex items-baseline gap-2 tabular-nums">
          <span>Lv {s.level.level}</span>
          <span className="hidden text-muted xl:inline">{s.xp} XP</span>
          <span className="text-crimson">
            {s.missionsDone}/{s.missionsTotal}
          </span>
        </span>
      ) : (
        <span>Driver</span>
      )}
    </button>
  );
}
