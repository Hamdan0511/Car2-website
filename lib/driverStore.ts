"use client";

import { useSyncExternalStore } from "react";
import {
  createDriverId,
  DISCOVERIES,
  EMPTY_PROGRESS,
  INTRO_SEEN_KEY,
  MISSIONS,
  parseProgress,
  REDLINE,
  safeStorage,
  SESSION_ID_KEY,
  STORAGE_KEY,
  type DiscoveryId,
  type MissionId,
  type Progress,
} from "@/lib/driver";

/* ---------------------------------------------------------------
   Driver store: one module-level source of truth, read through
   useSyncExternalStore. The server snapshot is always "not started",
   so markup hydrates identically and real progress arrives in the
   first client render. All mutations go through `update()`, which
   is synchronous, idempotent and the only place rewards are granted.
---------------------------------------------------------------- */

export type Panel = "missions" | "card" | null;
export type Snapshot = { progress: Progress; driverId: string | null; panel: Panel; hydrated: boolean };
export type Unlock = { kind: "mission" | "discovery" | "redline" | "start"; title: string; xp: number };

const SERVER: Snapshot = { progress: EMPTY_PROGRESS, driverId: null, panel: null, hydrated: false };
let snapshot: Snapshot = SERVER;
let loaded = false;
const listeners = new Set<() => void>();
const unlockListeners = new Set<(u: Unlock) => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const progress = parseProgress(safeStorage("local")?.getItem(STORAGE_KEY) ?? null);
  const driverId = progress.started ? ensureDriverId() : null;
  snapshot = { progress, driverId, panel: null, hydrated: true };
  // Returning visitors get a shortened opening next time (read in <head>).
  safeStorage("local")?.setItem(INTRO_SEEN_KEY, "1");
}

function ensureDriverId() {
  const s = safeStorage("session");
  const existing = s?.getItem(SESSION_ID_KEY);
  if (existing && /^FZ-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(existing)) return existing;
  const id = createDriverId();
  s?.setItem(SESSION_ID_KEY, id);
  return id;
}

function emit(next: Snapshot) {
  snapshot = next;
  listeners.forEach((l) => l());
}

function update(fn: (p: Progress) => Progress) {
  load();
  const prev = snapshot.progress;
  let next = fn(prev);
  // REDLINE unlocks exactly once: the first time all five missions are done.
  if (next.missions.length === MISSIONS.length && next.redlineAt === null) next = { ...next, redlineAt: Date.now() };
  if (next === prev) return;

  safeStorage("local")?.setItem(STORAGE_KEY, JSON.stringify(next));
  emit({ ...snapshot, progress: next, driverId: next.started ? (snapshot.driverId ?? ensureDriverId()) : snapshot.driverId });

  // Announce what was newly unlocked (diffed, so repeats never re-announce).
  const unlocks: Unlock[] = [];
  if (next.started && !prev.started) unlocks.push({ kind: "start", title: "Driver experience started", xp: 0 });
  MISSIONS.filter((m) => next.missions.includes(m.id) && !prev.missions.includes(m.id)).forEach((m) =>
    unlocks.push({ kind: "mission", title: m.title, xp: m.xp }),
  );
  DISCOVERIES.filter((d) => next.discoveries.includes(d.id) && !prev.discoveries.includes(d.id)).forEach((d) =>
    unlocks.push({ kind: "discovery", title: d.title, xp: d.xp }),
  );
  if (next.redlineAt && !prev.redlineAt) unlocks.push({ kind: "redline", title: REDLINE.title, xp: REDLINE.xp });
  unlocks.forEach((u) => unlockListeners.forEach((l) => l(u)));
}

/* ---------------------------- actions ---------------------------- */

export const driver = {
  start() {
    update((p) => (p.started ? p : { ...p, started: true }));
  },
  /** Idempotent: completing a mission twice changes nothing and grants nothing. */
  completeMission(id: MissionId) {
    update((p) => (!p.started || p.missions.includes(id) ? p : { ...p, missions: [...p.missions, id] }));
  },
  discover(id: DiscoveryId) {
    update((p) => (!p.started || p.discoveries.includes(id) ? p : { ...p, discoveries: [...p.discoveries, id] }));
  },
  reset() {
    load();
    safeStorage("local")?.removeItem(STORAGE_KEY);
    emit({ ...snapshot, progress: EMPTY_PROGRESS });
  },
  openPanel(panel: Exclude<Panel, null>) {
    load();
    emit({ ...snapshot, panel });
  },
  /** Closes `panel` only if it's the one showing — a dialog closing because
   *  another panel replaced it must not clear the new panel. */
  closePanel(panel: Exclude<Panel, null>) {
    if (snapshot.panel === panel) emit({ ...snapshot, panel: null });
  },
  onUnlock(listener: (u: Unlock) => void) {
    unlockListeners.add(listener);
    return () => {
      unlockListeners.delete(listener);
    };
  },
};

/* ------------------------------ hook ------------------------------ */

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const getSnapshot = () => {
  load();
  return snapshot;
};
const getServerSnapshot = () => SERVER;

export function useDriver() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ------------------------- intro control ------------------------- */

/**
 * Finishes the CSS opening sequence immediately (no restart, no re-render):
 * every running `fizz-*` keyframe animation jumps to its end state.
 */
export function skipIntro() {
  document.getAnimations().forEach((a) => {
    const name = "animationName" in a ? String((a as CSSAnimation).animationName) : "";
    // Looping ornaments (e.g. the scroll-indicator nudge) can't be finished.
    if (name.startsWith("fizz-") && a.effect?.getComputedTiming().iterations !== Infinity) a.finish();
  });
  window.dispatchEvent(new Event("fizz:intro-skipped"));
}
