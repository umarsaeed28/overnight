interface HankoProps {
  /** A single decorative kanji, for example 夜 or 朝. */
  kanji: string;
  className?: string;
  /** Degrees. A stamp is never applied perfectly straight. */
  rotate?: number;
}

/**
 * A round seal in the accent colour with a soft ink bleed at the edge. It
 * carries no meaning for a screen reader, so it is hidden from one.
 */
export function Hanko({ kanji, className, rotate = -8 }: HankoProps) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-kanji ${className ?? ""}`}
      style={{
        transform: `rotate(${rotate}deg)`,
        backgroundColor: "var(--color-hanko)",
        color: "var(--color-washi)",
        boxShadow:
          "0 0 0 1px color-mix(in srgb, var(--color-hanko) 55%, transparent), 0 2px 8px -2px color-mix(in srgb, var(--color-hanko) 70%, transparent)",
      }}
    >
      {kanji}
    </span>
  );
}
