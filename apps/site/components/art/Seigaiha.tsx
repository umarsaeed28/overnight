interface SeigaihaProps {
  className?: string;
  /** Unique per instance: SVG pattern ids are global to the document. */
  id?: string;
  fill?: string;
  /** Tile width in pixels. The pattern always keeps its own proportions. */
  scale?: number;
  opacity?: number;
}

/**
 * Seigaiha, the overlapping wave pattern. Drawn at its natural proportions and
 * tiled, so it never stretches with the viewport.
 */
export function Seigaiha({
  className,
  id = "seigaiha",
  fill = "var(--color-sora)",
  scale = 72,
  opacity = 1,
}: SeigaihaProps) {
  const height = scale / 2;

  return (
    <svg className={className} aria-hidden focusable="false" role="presentation">
      <defs>
        <pattern
          id={id}
          x="0"
          y="0"
          width={scale}
          height={height}
          patternUnits="userSpaceOnUse"
          viewBox="0 0 40 20"
        >
          <g fill="none" stroke="var(--color-ink)" strokeOpacity="0.16" strokeWidth="1">
            <path d="M-20 20 a20 20 0 0 1 40 0" fill={fill} fillOpacity="0.5" />
            <path d="M-20 20 a13.5 13.5 0 0 1 27 0" />
            <path d="M-20 20 a7 7 0 0 1 14 0" />
            <path d="M20 20 a20 20 0 0 1 40 0" fill={fill} fillOpacity="0.5" />
            <path d="M20 20 a13.5 13.5 0 0 1 27 0" />
            <path d="M20 20 a7 7 0 0 1 14 0" />
            <path d="M0 40 a20 20 0 0 1 40 0" fill={fill} fillOpacity="0.62" />
            <path d="M0 40 a13.5 13.5 0 0 1 27 0" />
            <path d="M0 40 a7 7 0 0 1 14 0" />
          </g>
        </pattern>

        {/* The band dissolves upward so it meets the sky without an edge. */}
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
        </linearGradient>
        <mask id={`${id}-mask`}>
          <rect width="100%" height="100%" fill={`url(#${id}-fade)`} />
        </mask>
      </defs>

      <rect
        width="100%"
        height="100%"
        fill={`url(#${id})`}
        opacity={opacity}
        mask={`url(#${id}-mask)`}
      />
    </svg>
  );
}

/** A softer divider between two sections. */
export function SeigaihaDivider({ className, id = "seigaiha-divider", fill }: SeigaihaProps) {
  return (
    <div aria-hidden className={className}>
      <Seigaiha id={id} fill={fill} scale={64} opacity={0.6} className="h-14 w-full" />
    </div>
  );
}
