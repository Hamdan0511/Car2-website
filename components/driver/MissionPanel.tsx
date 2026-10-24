"use client";

import { useEffect, useRef, useState } from "react";
import { deriveStats, DISCOVERIES, MISSIONS, REDLINE } from "@/lib/driver";
import { driver, useDriver, type Panel } from "@/lib/driverStore";
import { scrollToTarget } from "@/lib/motion";

/** Keeps a native <dialog> in sync with the store's `panel` value. */
export function useStoreDialog(name: Exclude<Panel, null>, open: boolean) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onClose = () => driver.closePanel(name);
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, [name]);
  return ref;
}

function Status({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-5 shrink-0 place-items-center rounded-full border text-[10px] ${
        done ? "border-crimson bg-crimson text-paper" : "border-paper/25 text-transparent"
      }`}
    >
      ✓
    </span>
  );
}

export default function MissionPanel() {
  const { progress, driverId, panel } = useDriver();
  const dialog = useStoreDialog("missions", panel === "missions");
  const [confirmReset, setConfirmReset] = useState(false);
  const s = deriveStats(progress);

  const go = (target: string) => {
    dialog.current?.close();
    requestAnimationFrame(() => scrollToTarget(target));
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="mission-panel-title"
      onClick={(e) => e.target === dialog.current && dialog.current.close()}
      className="driver-drawer text-paper backdrop:bg-ink/80"
    >
      <div className="flex min-h-full flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="t-eyebrow flex items-center gap-3">
              <span aria-hidden className="block h-px w-8 bg-crimson" />
              FIZZ driver experience
            </p>
            <h2 id="mission-panel-title" className="mt-4 text-2xl font-light uppercase tracking-[0.2em]">
              Mission panel
            </h2>
            {driverId && progress.started && (
              <p className="t-micro mt-3 text-muted">
                Driver ID <span className="text-paper">{driverId}</span>
                <span className="block normal-case tracking-normal text-muted/80 [font-family:var(--font-sans)] text-xs mt-1">
                  Cosmetic, random and session-only. Not an account.
                </span>
              </p>
            )}
          </div>
          <button type="button" onClick={() => dialog.current?.close()} className="t-micro -mr-2 min-h-11 shrink-0 px-3 hover:text-crimson">
            Close ✕
          </button>
        </header>

        {!progress.started ? (
          <section aria-label="Start" className="flex flex-col gap-6">
            <p className="t-copy max-w-none">
              Become a FIZZ driver. Explore each section to complete five missions, inspect the car&rsquo;s details, earn XP and
              unlock the REDLINE driver card. It&rsquo;s optional — the site works the same without it.
            </p>
            <button type="button" onClick={() => driver.start()} className="btn-line self-start">
              Start driver experience <span aria-hidden className="arrow">↗</span>
            </button>
          </section>
        ) : (
          <>
            {/* Level + XP */}
            <section aria-labelledby="dp-level" className="border-y border-paper/10 py-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p id="dp-level" className="t-micro text-muted">
                    Driver level
                  </p>
                  <p className="mt-2 text-3xl font-extralight tabular-nums">
                    {s.level.level} <span className="text-base uppercase tracking-[0.2em] text-silver">{s.level.name}</span>
                  </p>
                </div>
                <p className="t-micro text-right text-muted">
                  <span className="block text-2xl font-extralight tracking-normal text-paper tabular-nums [font-family:var(--font-sans)]">
                    {s.xp} XP
                  </span>
                  {s.next ? `${s.next.minXp - s.xp} XP to ${s.next.name}` : "Maximum level"}
                </p>
              </div>
              <div
                role="progressbar"
                aria-label="Progress to next level"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(s.levelProgress * 100)}
                className="mt-5 h-px bg-paper/15"
              >
                <div className="h-full origin-left bg-crimson transition-transform duration-700" style={{ transform: `scaleX(${s.levelProgress})` }} />
              </div>
            </section>

            {/* Missions */}
            <section aria-labelledby="dp-missions">
              <div className="flex items-baseline justify-between">
                <h3 id="dp-missions" className="t-micro text-paper">
                  Missions <span className="text-crimson">{s.missionsDone}/{s.missionsTotal}</span>
                </h3>
                <p className="t-micro text-muted">{s.completion}% complete</p>
              </div>
              <ul className="mt-4 divide-y divide-paper/10 border-y border-paper/10">
                {MISSIONS.map((m) => {
                  const done = progress.missions.includes(m.id);
                  const current = s.currentMission?.id === m.id;
                  return (
                    <li key={m.id} className="flex items-center gap-4 py-3">
                      <Status done={done} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm uppercase tracking-[0.14em] ${done ? "text-paper" : "text-silver/80"}`}>
                          <span className="t-micro mr-2 text-crimson">{m.code}</span>
                          {m.title}
                          <span className="sr-only">{done ? " — complete" : current ? " — current mission" : " — not yet complete"}</span>
                        </p>
                        {!done && <p className="mt-1 text-xs text-muted">{m.hint}</p>}
                      </div>
                      <span className="t-micro shrink-0 text-muted tabular-nums">+{m.xp}</span>
                      {!done && (
                        <button type="button" onClick={() => go(m.target)} className="t-micro min-h-11 shrink-0 px-2 text-paper hover:text-crimson">
                          Go<span className="sr-only"> to {m.title}</span> →
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Inspection checklist */}
            <section aria-labelledby="dp-inspect">
              <h3 id="dp-inspect" className="t-micro text-paper">
                Inspection checklist
              </h3>
              <ul className="mt-4 divide-y divide-paper/10 border-y border-paper/10">
                {DISCOVERIES.map((d) => {
                  const done = progress.discoveries.includes(d.id);
                  return (
                    <li key={d.id} className="flex items-center gap-4 py-3">
                      <Status done={done} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm uppercase tracking-[0.14em] ${done ? "text-paper" : "text-silver/80"}`}>
                          {d.title}
                          <span className="sr-only">{done ? " — inspected" : " — not yet inspected"}</span>
                        </p>
                        {!done && <p className="mt-1 text-xs text-muted">{d.hint}</p>}
                      </div>
                      <span className="t-micro shrink-0 text-muted tabular-nums">+{d.xp}</span>
                      {!done && (
                        <button type="button" onClick={() => go(d.target)} className="t-micro min-h-11 shrink-0 px-2 text-paper hover:text-crimson">
                          Go<span className="sr-only"> to {d.title}</span> →
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* REDLINE */}
            <section
              aria-labelledby="dp-redline"
              className={`border px-5 py-5 ${s.redline ? "border-crimson/70 bg-crimson/[0.06]" : "border-paper/10"}`}
            >
              <h3 id="dp-redline" className="t-micro flex items-center justify-between text-paper">
                <span>
                  Final achievement — <span className="text-crimson">{REDLINE.title}</span>
                </span>
                <span className="text-muted">+{REDLINE.xp}</span>
              </h3>
              <p className="mt-3 text-sm text-silver/80">
                {s.redline
                  ? "Unlocked. Your driver card is ready."
                  : `Locked — complete all five missions (${s.missionsDone}/${s.missionsTotal}).`}
              </p>
              {s.redline && (
                <button type="button" onClick={() => driver.openPanel("card")} className="btn-line mt-5">
                  View driver card <span aria-hidden className="arrow">↗</span>
                </button>
              )}
            </section>

            <footer className="mt-auto flex flex-col gap-4 border-t border-paper/10 pt-6">
              <p className="text-xs leading-relaxed text-muted">
                Progress is saved in this browser only. XP and levels are game rewards, not vehicle data.
              </p>
              {!confirmReset ? (
                <button type="button" onClick={() => setConfirmReset(true)} className="t-micro min-h-11 self-start text-muted hover:text-crimson">
                  Reset progress
                </button>
              ) : (
                <div role="group" aria-label="Confirm reset" className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-silver">Clear all missions and XP on this device?</p>
                  <button type="button" autoFocus onClick={() => setConfirmReset(false)} className="btn-line">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      driver.reset();
                      setConfirmReset(false);
                    }}
                    className="btn-line border-crimson/60"
                  >
                    Reset
                  </button>
                </div>
              )}
            </footer>
          </>
        )}
      </div>
    </dialog>
  );
}
