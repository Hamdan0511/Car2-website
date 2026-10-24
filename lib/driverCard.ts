"use client";

import { IMAGES } from "@/lib/site";

export type CardData = {
  driverId: string;
  level: number;
  levelName: string;
  xp: number;
  missions: string;
  date: string;
};

const W = 1200;
const H = 630;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

/** Draws text with manual tracking (canvas letterSpacing isn't universal). */
function tracked(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
}

/**
 * Renders the REDLINE driver card to a JPEG blob with the Canvas API — no
 * dependency. Uses the page's own loaded webfonts (next/font gives them
 * hashed family names, so they're read from computed styles).
 */
export async function renderDriverCard(data: CardData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  await document.fonts.ready;
  const sans = getComputedStyle(document.body).fontFamily;
  const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-plex-mono").trim() || "monospace";

  // Background: ink, then the overhead redline photograph on the right.
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, W, H);
  const img = await loadImage(IMAGES.redline.src);
  const ih = H;
  const iw = (img.width / img.height) * ih;
  ctx.drawImage(img, W - iw * 0.78, 0, iw, ih);
  const fade = ctx.createLinearGradient(0, 0, W, 0);
  fade.addColorStop(0, "rgba(5,5,5,1)");
  fade.addColorStop(0.42, "rgba(5,5,5,0.92)");
  fade.addColorStop(0.75, "rgba(5,5,5,0.15)");
  fade.addColorStop(1, "rgba(5,5,5,0.4)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, H);

  // Crimson frame lines (the letterbox motif).
  ctx.fillStyle = "#ff263b";
  ctx.fillRect(0, 0, W, 2);
  ctx.fillRect(0, H - 2, W, 2);
  ctx.fillRect(72, 300, 56, 2);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f5f5f5";
  ctx.font = `500 30px ${sans}`;
  tracked(ctx, "FIZZ", 72, 104, 14);

  ctx.font = `400 15px ${mono}`;
  ctx.fillStyle = "#ff263b";
  tracked(ctx, "REDLINE · DRIVER CARD", 72, 170, 5);

  ctx.fillStyle = "#f5f5f5";
  ctx.font = `300 64px ${sans}`;
  tracked(ctx, `LEVEL ${data.level}`, 72, 254, 10);
  ctx.font = `300 26px ${sans}`;
  ctx.fillStyle = "#c7cbd1";
  tracked(ctx, data.levelName.toUpperCase(), 148, 310, 8);

  const stats: [string, string][] = [
    ["XP", String(data.xp)],
    ["MISSIONS", data.missions],
    ["DRIVER ID", data.driverId],
  ];
  stats.forEach(([label, value], i) => {
    const x = 72 + i * 190;
    ctx.font = `400 13px ${mono}`;
    ctx.fillStyle = "#858a94";
    tracked(ctx, label, x, 420, 3);
    ctx.font = `300 ${i === 2 ? 26 : 40}px ${i === 2 ? mono : sans}`;
    ctx.fillStyle = "#f5f5f5";
    ctx.fillText(value, x, 466);
  });

  ctx.font = `400 13px ${mono}`;
  ctx.fillStyle = "#858a94";
  tracked(ctx, `REDLINE UNLOCKED ${data.date.toUpperCase()}`, 72, 560, 3);
  tracked(ctx, "FIZZ IS A CONCEPT BRAND · XP IS A GAME REWARD", 72, 586, 3);

  // JPEG: the card is mostly photograph — ~6× smaller than PNG, visually equivalent.
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.92));
}
