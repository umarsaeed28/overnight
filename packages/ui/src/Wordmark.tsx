import { Tick } from "./Tick.js";

/**
 * "vibe ✓ check": light-handed lowercase with a small raised coral key holding the tick
 * between the words. A type treatment, not a logo. Announced as "Vibe Check".
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Vibe Check"
      className={`vc-display inline-flex items-center gap-[0.18em] lowercase leading-none ${className}`}
    >
      <span aria-hidden="true">vibe</span>
      <span
        aria-hidden="true"
        className="nm-key grid h-[1.05em] w-[1.05em] shrink-0 -rotate-6 place-items-center [--r:32%]"
        style={{ textShadow: "none" }}
      >
        <Tick className="h-[0.62em] w-[0.62em]" />
      </span>
      <span aria-hidden="true">check</span>
    </span>
  );
}
