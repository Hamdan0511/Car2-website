"use client";

type Props = {
  label: string;
  active: boolean;
  onSelect: () => void;
  controls: string;
  /** Visible caption beside the dot (hidden on narrow screens when `compact`). */
  showLabel?: boolean;
  className?: string;
};

/**
 * An inspection point on a photograph: a real button with a 44 px hit area
 * around a small visual ring. Its details render in a separate panel
 * (`controls`), so nothing pops over the car itself.
 */
export default function Hotspot({ label, active, onSelect, controls, showLabel = true, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-controls={controls}
      aria-label={`Inspect: ${label}`}
      className={`group/hs relative flex min-h-11 min-w-11 items-center gap-3 rounded-full outline-offset-2 ${className}`}
    >
      <span aria-hidden className="grid size-11 shrink-0 place-items-center">
        <span
          className={`block size-3 rounded-full border transition-all duration-500 ease-[var(--ease-cine)] group-hover/hs:scale-125 ${
            active
              ? "scale-125 border-crimson bg-crimson shadow-[0_0_16px_rgb(255_38_59/0.9)]"
              : "border-crimson bg-ink/60 shadow-[0_0_12px_rgb(255_38_59/0.7)]"
          }`}
        />
      </span>
      {showLabel && (
        <span
          aria-hidden
          className={`t-micro -ml-2 whitespace-nowrap pr-3 [text-shadow:0_1px_12px_rgb(0_0_0/0.95)] transition-colors ${
            active ? "text-crimson" : "text-paper/90 group-hover/hs:text-paper"
          }`}
        >
          {label}
        </span>
      )}
    </button>
  );
}
