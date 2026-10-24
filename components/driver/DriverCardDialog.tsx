"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useStoreDialog } from "@/components/driver/MissionPanel";
import { deriveStats } from "@/lib/driver";
import { renderDriverCard, type CardData } from "@/lib/driverCard";
import { useDriver } from "@/lib/driverStore";
import { IMAGES } from "@/lib/site";

type Status = { tone: "ok" | "info" | "error"; text: string } | null;

/**
 * The REDLINE finale: a short cinematic reveal (crimson line → card opens from
 * a letterbox slit → stats rise) and the personalised driver card with share,
 * copy and download. Status messages report only what actually happened.
 */
export default function DriverCardDialog() {
  const { progress, driverId, panel } = useDriver();
  const dialog = useStoreDialog("card", panel === "card");
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const s = deriveStats(progress);
  const open = panel === "card" && s.redline;

  const date = progress.redlineAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(progress.redlineAt) : "";
  const data: CardData = {
    driverId: driverId ?? "FZ-GUEST",
    level: s.level.level,
    levelName: s.level.name,
    xp: s.xp,
    missions: `${s.missionsDone}/${s.missionsTotal}`,
    date,
  };
  // Pre-render the image when the card opens: Web Share needs the click's
  // transient activation, which an await-heavy render could let lapse.
  const cardFile = useRef<File | null>(null);
  const cardKey = `${data.driverId}|${data.level}|${data.xp}|${data.missions}|${data.date}`;
  useEffect(() => {
    if (!open) return;
    let alive = true;
    cardFile.current = null;
    renderDriverCard(data)
      .then((b) => alive && (cardFile.current = new File([b], "fizz-driver-card.jpg", { type: "image/jpeg" })))
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cardKey captures every input of `data`
  }, [open, cardKey]);

  const stats = [
    ["XP", String(data.xp)],
    ["Missions", data.missions],
    ["Driver ID", data.driverId],
  ] as const;

  const url = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
  const summary = `I unlocked REDLINE in the FIZZ Driver Experience — Level ${data.level} ${data.levelName}, ${data.xp} XP, ${data.missions} missions.`;

  const share = async () => {
    setBusy(true);
    setStatus(null);
    try {
      let shared = false;
      if (navigator.share) {
        const file = cardFile.current;
        const payload: ShareData = file && navigator.canShare?.({ files: [file] }) ? { files: [file], text: summary, title: "FIZZ driver card" } : { title: "FIZZ driver card", text: summary, url };
        await navigator.share(payload);
        shared = true;
        setStatus({ tone: "ok", text: "Shared." });
      }
      if (!shared) await copy();
    } catch (e) {
      if ((e as Error).name === "AbortError") setStatus({ tone: "info", text: "Share cancelled." });
      else await copy();
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${summary} ${url}`);
      setStatus({ tone: "ok", text: "Summary and link copied to the clipboard." });
    } catch {
      setStatus({ tone: "error", text: "Couldn't access the clipboard — select and copy the text below." });
    }
  };

  const download = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const blob = await renderDriverCard(data);
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `fizz-driver-card-${data.driverId}.jpg`;
      document.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 10_000);
      setStatus({ tone: "ok", text: "Download started (JPEG, 1200 × 630)." });
    } catch {
      setStatus({ tone: "error", text: "The image couldn't be created in this browser. You can still share or copy the summary." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="card-title"
      onClick={(e) => e.target === dialog.current && dialog.current.close()}
      className="viewer m-auto bg-transparent text-paper backdrop:bg-ink/[0.985]"
    >
      {open && (
        <div className="redline-reveal mx-auto flex w-full max-w-4xl flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="t-eyebrow redline-reveal__step flex items-center gap-3 text-crimson" style={{ "--d": 0 } as CSSProperties}>
                <span aria-hidden className="block h-px w-8 bg-crimson" />
                Achievement unlocked
              </p>
              <h2 id="card-title" className="t-display redline-reveal__step mt-3 text-[clamp(1.6rem,4vw,3rem)]" style={{ "--d": 1 } as CSSProperties}>
                Redline
              </h2>
            </div>
            <button type="button" autoFocus onClick={() => dialog.current?.close()} className="t-micro -mr-2 min-h-11 shrink-0 px-3 hover:text-crimson">
              Close ✕
            </button>
          </div>

          <span aria-hidden className="redline-reveal__line block h-px w-full bg-crimson shadow-[0_0_18px_2px_rgb(255_38_59/0.6)]" />

          {/* The card (an HTML twin of the exported image). */}
          <figure className="redline-reveal__card relative aspect-[1200/630] w-full overflow-hidden border-y border-crimson bg-ink">
            <Image src={IMAGES.redline.src} alt="" fill sizes="(min-width: 900px) 56rem, 100vw" className="object-cover object-[78%_50%]" />
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,#050505_0%,rgb(5_5_5/0.92)_42%,rgb(5_5_5/0.15)_75%,rgb(5_5_5/0.4)_100%)]" />
            <figcaption className="absolute inset-0 flex flex-col justify-between p-[6%]">
              <div>
                <p className="text-[clamp(0.9rem,2.4vw,1.6rem)] font-medium tracking-[0.5em]">FIZZ</p>
                <p className="t-micro mt-[3%] text-crimson">Redline · Driver card</p>
              </div>
              <div>
                <p className="text-[clamp(1.4rem,5vw,3.4rem)] font-light leading-none tracking-[0.12em]">LEVEL {data.level}</p>
                <p className="mt-2 text-[clamp(0.7rem,2vw,1.25rem)] font-light uppercase tracking-[0.3em] text-silver">{data.levelName}</p>
              </div>
              {/* Large screens: stats overlaid like the exported image. */}
              <dl className="hidden grid-cols-[auto_auto_1fr] gap-x-[7%] sm:grid">
                {stats.map(([k, v]) => (
                  <div key={k}>
                    <dt className="t-micro text-[clamp(0.5rem,1.1vw,0.65rem)] text-muted">{k}</dt>
                    <dd className={`mt-1 whitespace-nowrap font-light tabular-nums ${k === "Driver ID" ? "font-mono text-[clamp(0.7rem,1.8vw,1.15rem)]" : "text-[clamp(0.9rem,2.6vw,1.6rem)]"}`}>{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="t-micro hidden text-[clamp(0.45rem,1.1vw,0.65rem)] text-muted sm:block">Redline unlocked {date}</p>
            </figcaption>
          </figure>
          {/* Phones: the card is too small to carry text over the photo, so the stats sit below it. */}
          <dl className="redline-reveal__step grid grid-cols-3 gap-4 border-b border-paper/10 pb-5 sm:hidden" style={{ "--d": 2 } as CSSProperties}>
            {stats.map(([k, v]) => (
              <div key={k}>
                <dt className="t-micro text-muted">{k}</dt>
                <dd className={`mt-1.5 font-light tabular-nums ${k === "Driver ID" ? "font-mono text-sm" : "text-xl"}`}>{v}</dd>
              </div>
            ))}
            <p className="t-micro col-span-3 text-muted">Redline unlocked {date}</p>
          </dl>

          <div className="redline-reveal__step flex flex-wrap items-center gap-3" style={{ "--d": 3 } as CSSProperties}>
            <button type="button" onClick={share} disabled={busy} className="btn-line disabled:opacity-50">
              Share <span aria-hidden className="arrow">↗</span>
            </button>
            <button type="button" onClick={copy} disabled={busy} className="btn-line disabled:opacity-50">
              Copy summary
            </button>
            <button type="button" onClick={download} disabled={busy} className="btn-line disabled:opacity-50">
              Download image
            </button>
          </div>
          <p role="status" aria-live="polite" className={`min-h-5 text-sm ${status?.tone === "error" ? "text-crimson" : "text-silver"}`}>
            {status?.text}
          </p>
          {status?.tone === "error" && (
            <textarea readOnly value={`${summary} ${url}`} aria-label="Shareable summary" className="h-20 w-full resize-none border border-paper/20 bg-ink p-3 text-sm text-paper" />
          )}
        </div>
      )}
    </dialog>
  );
}
