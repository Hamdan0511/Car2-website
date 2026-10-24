/**
 * FIZZ Driver Experience — the single source of truth for missions, rewards,
 * levels and stored progress. Everything the UI shows (XP, level, completion,
 * current mission, REDLINE) is *derived* from the stored lists of completed
 * IDs, so values can never drift apart. XP and levels are game rewards, not
 * vehicle figures.
 */

export const MISSIONS = [
  { id: "performance", code: "01", title: "Performance Explorer", target: "#performance", hint: "Explore the Performance section", xp: 100 },
  { id: "design", code: "02", title: "Design Connoisseur", target: "#design", hint: "Explore the Design section", xp: 100 },
  { id: "technology", code: "03", title: "Technology Specialist", target: "#technology", hint: "Explore the Technology section", xp: 100 },
  { id: "engineering", code: "04", title: "Engineering Insider", target: "#engineering", hint: "Explore the Engineering index", xp: 100 },
  { id: "gallery", code: "05", title: "Gallery Hunter", target: "#gallery", hint: "Open a plate in the Gallery", xp: 100 },
] as const;

/** Inspection checklist: unlocked by opening any hotspot in its group. */
export const DISCOVERIES = [
  { id: "front", title: "Front design", hint: "Inspect a front-end hotspot in Design", target: "#design", xp: 50 },
  { id: "side", title: "Side profile", hint: "Inspect a side hotspot in Design", target: "#design", xp: 50 },
  { id: "rear", title: "Rear styling", hint: "Inspect a hotspot on the plan view in Technology", target: "#technology", xp: 50 },
] as const;

export const REDLINE = { id: "redline", title: "REDLINE", xp: 250 } as const;

export const LEVELS = [
  { level: 1, name: "Rookie", minXp: 0 },
  { level: 2, name: "Contender", minXp: 150 },
  { level: 3, name: "Pro", minXp: 350 },
  { level: 4, name: "Elite", minXp: 600 },
  { level: 5, name: "Legend", minXp: 900 },
] as const;

export type MissionId = (typeof MISSIONS)[number]["id"];
export type DiscoveryId = (typeof DISCOVERIES)[number]["id"];
export type Mission = (typeof MISSIONS)[number];
export type Discovery = (typeof DISCOVERIES)[number];

export const MAX_XP =
  MISSIONS.reduce((n, m) => n + m.xp, 0) + DISCOVERIES.reduce((n, d) => n + d.xp, 0) + REDLINE.xp;

/** Persisted progress. Only completed IDs and timestamps — never derived values. */
export type Progress = {
  v: 1;
  started: boolean;
  missions: MissionId[];
  discoveries: DiscoveryId[];
  /** When REDLINE unlocked (ms since epoch); set exactly once. */
  redlineAt: number | null;
};

export const EMPTY_PROGRESS: Progress = { v: 1, started: false, missions: [], discoveries: [], redlineAt: null };

export type Stats = ReturnType<typeof deriveStats>;

export function deriveStats(p: Progress) {
  const xp =
    MISSIONS.filter((m) => p.missions.includes(m.id)).reduce((n, m) => n + m.xp, 0) +
    DISCOVERIES.filter((d) => p.discoveries.includes(d.id)).reduce((n, d) => n + d.xp, 0) +
    (p.redlineAt ? REDLINE.xp : 0);
  const levelIndex = LEVELS.reduce((idx, l, i) => (xp >= l.minXp ? i : idx), 0);
  const level = LEVELS[levelIndex];
  const next = LEVELS[levelIndex + 1] ?? null;
  const missionsDone = MISSIONS.filter((m) => p.missions.includes(m.id)).length;
  return {
    xp,
    level,
    next,
    /** 0–1 progress from this level's threshold to the next. */
    levelProgress: next ? (xp - level.minXp) / (next.minXp - level.minXp) : 1,
    missionsDone,
    missionsTotal: MISSIONS.length,
    /** Completion = completed discovery missions / 5 × 100. */
    completion: Math.round((missionsDone / MISSIONS.length) * 100),
    currentMission: MISSIONS.find((m) => !p.missions.includes(m.id)) ?? null,
    redlineReady: missionsDone === MISSIONS.length,
    redline: p.redlineAt !== null,
  };
}

/* ---------------------------------------------------------------
   Storage. Progress: localStorage (versioned key). Driver ID:
   sessionStorage (cosmetic, per-session). Every read is validated;
   unavailable storage (private mode, blocked) degrades to memory.
---------------------------------------------------------------- */
export const STORAGE_KEY = "fizz.driver.v1";
export const SESSION_ID_KEY = "fizz.driverId";
/** Read by the inline <head> script to shorten the opening for returning visitors. */
export const INTRO_SEEN_KEY = "fizz.introSeen";

const MISSION_IDS = new Set<string>(MISSIONS.map((m) => m.id));
const DISCOVERY_IDS = new Set<string>(DISCOVERIES.map((d) => d.id));

/** Parses stored JSON into a valid Progress, discarding anything malformed. */
export function parseProgress(raw: string | null): Progress {
  if (!raw) return EMPTY_PROGRESS;
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || (data as { v?: unknown }).v !== 1) return EMPTY_PROGRESS;
    const d = data as Record<string, unknown>;
    const ids = <T extends string>(value: unknown, allowed: Set<string>) =>
      Array.isArray(value) ? ([...new Set(value.filter((x): x is T => typeof x === "string" && allowed.has(x)))] as T[]) : [];
    const missions = ids<MissionId>(d.missions, MISSION_IDS);
    const redlineAt =
      typeof d.redlineAt === "number" && Number.isFinite(d.redlineAt) && missions.length === MISSIONS.length ? d.redlineAt : null;
    return { v: 1, started: d.started === true, missions, discoveries: ids<DiscoveryId>(d.discoveries, DISCOVERY_IDS), redlineAt };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function safeStorage(kind: "local" | "session"): Storage | null {
  try {
    const s = kind === "local" ? window.localStorage : window.sessionStorage;
    const probe = "__fizz_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

/** Cosmetic, non-identifying driver ID, e.g. "FZ-7K3Q-92XA". Not an account. */
export function createDriverId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `FZ-${chars.slice(0, 4)}-${chars.slice(4)}`;
}
