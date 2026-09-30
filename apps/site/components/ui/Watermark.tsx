interface WatermarkProps {
  /** A single kanji. Decorative, so it never reaches assistive technology. */
  kanji: string;
  className?: string;
}

/** A very large, very faint kanji sitting behind a section title. */
export function Watermark({ kanji, className }: WatermarkProps) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute select-none font-kanji leading-none text-ink opacity-[0.05] ${className ?? ""}`}
    >
      {kanji}
    </span>
  );
}
