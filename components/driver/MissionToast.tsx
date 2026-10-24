"use client";

import { useEffect, useRef, useState } from "react";
import { driver, type Unlock } from "@/lib/driverStore";

// A lone toast lingers; a backlog moves faster so rewards stay close to the
// actions that earned them.
const SHOW_MS = 5000;
const BACKLOG_MS = 2200;

const heading: Record<Unlock["kind"], string> = {
  start: "Driver initiated",
  mission: "Mission complete",
  discovery: "Inspection logged",
  redline: "Achievement unlocked",
};

/**
 * Short, dismissible unlock notifications. One at a time, queued, announced
 * politely to screen readers. Rendered as a manual popover so it appears in
 * the top layer above an open dialog (e.g. the gallery viewer that just
 * completed a mission); falls back to a fixed element elsewhere.
 */
export default function MissionToast() {
  const [queue, setQueue] = useState<Unlock[]>([]);
  const region = useRef<HTMLDivElement>(null);
  const current = queue[0];

  useEffect(() => driver.onUnlock((u) => setQueue((q) => [...q, u])), []);

  useEffect(() => {
    const el = region.current;
    if (!el || !("showPopover" in el)) return;
    const open = el.matches(":popover-open");
    if (current && !open) el.showPopover();
    // Re-show on top if a dialog opened since (top layer = last shown wins).
    if (current && open) {
      el.hidePopover();
      el.showPopover();
    }
    if (!current && open) el.hidePopover();
  }, [current]);

  const backlog = queue.length > 1;
  useEffect(() => {
    if (!current) return;
    const t = window.setTimeout(() => setQueue((q) => q.slice(1)), backlog ? BACKLOG_MS : SHOW_MS);
    return () => window.clearTimeout(t);
  }, [current, backlog]);

  return (
    <>
      {/* Always in the accessibility tree, so announcements are reliable; the
          visual toast below is not a live region (no double announcement). */}
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {current ? `${heading[current.kind]}: ${current.title}${current.xp > 0 ? `, plus ${current.xp} XP` : ""}` : ""}
      </p>
      <div ref={region} popover="manual" className="mission-toast" data-needs-js>
        {current && (
          <div key={`${current.kind}-${current.title}`} className="mission-toast__card">
            <span aria-hidden className="mission-toast__line" />
            <div className="min-w-0 flex-1">
              <p className="t-micro text-crimson">{heading[current.kind]}</p>
              <p className="mt-1.5 text-sm uppercase leading-snug tracking-[0.18em] text-paper">{current.title}</p>
            </div>
            {current.xp > 0 && <p className="t-micro shrink-0 text-paper tabular-nums">+{current.xp} XP</p>}
            {current.kind === "redline" && (
              <button
                type="button"
                onClick={() => {
                  setQueue((q) => q.slice(1));
                  driver.openPanel("card");
                }}
                className="t-micro min-h-11 shrink-0 px-2 text-crimson hover:text-paper"
              >
                View card
              </button>
            )}
            <button
              type="button"
              onClick={() => setQueue((q) => q.slice(1))}
              aria-label="Dismiss notification"
              className="t-micro grid min-h-11 min-w-11 shrink-0 place-items-center text-muted hover:text-paper"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </>
  );
}
