import type { ReactNode } from "react";

type Props = {
  index: string;
  eyebrow: string;
  title: readonly string[];
  headingId: string;
  copy?: string;
  children?: ReactNode;
  className?: string;
};

/**
 * Editorial heading block shared by the numbered sections. Animation hooks
 * (data-line / data-fade / data-accent / data-num) are consumed by
 * `revealIntro()` in lib/motion.
 */
export default function SectionIntro({ index, eyebrow, title, headingId, copy, children, className = "" }: Props) {
  return (
    <div className={`relative ${className}`}>
      <span aria-hidden data-num className="t-index block">
        {index}
      </span>
      <p data-fade className="t-eyebrow mt-8 flex items-center gap-4">
        <span aria-hidden data-accent className="block h-px w-10 origin-left bg-crimson" />
        {eyebrow}
      </p>
      <h2 id={headingId} className="t-display mt-6 text-[clamp(2rem,4.3vw,4.5rem)]">
        {title.map((line) => (
          <span key={line} className="line-mask">
            <span data-line className="block">
              {line}
            </span>
          </span>
        ))}
      </h2>
      {copy && (
        <p data-fade className="t-copy mt-7">
          {copy}
        </p>
      )}
      {children}
    </div>
  );
}
