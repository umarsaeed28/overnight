interface CraneProps {
  className?: string;
  /** Body fill. The raised wing stays pale so the fold reads. */
  fill?: string;
}

/**
 * The mascot, flying to the right. One wing raised with a second just behind
 * it, a long neck reaching forward to the beak, and a short tail swept back,
 * so the direction of flight is never ambiguous.
 */
export function Crane({ className, fill = "var(--color-sakura)" }: CraneProps) {
  return (
    <svg
      viewBox="0 0 190 120"
      className={className}
      aria-hidden
      focusable="false"
      role="presentation"
    >
      <g
        stroke="var(--color-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* far wing, mostly hidden behind the near one */}
        <path d="M60 70 L80 36 L110 60 Z" fill={fill} fillOpacity="0.5" />

        {/* tail, short and swept back */}
        <path d="M58 72 L18 54 L24 62 L62 82 Z" fill={fill} fillOpacity="0.85" />

        {/* body */}
        <path d="M58 72 L130 60 L126 76 L78 94 Z" fill={fill} />

        {/* near wing, raised into the light */}
        <path d="M70 68 L104 14 L132 64 Z" fill="var(--color-white)" fillOpacity="0.95" />

        {/* neck, reaching forward */}
        <path d="M128 62 L174 30 L178 38 L132 72 Z" fill={fill} />

        {/* beak */}
        <path d="M174 30 L188 30 L177 38 Z" fill={fill} />

        {/* breast fold */}
        <path d="M104 62 L78 94" fill="none" strokeOpacity="0.4" />
      </g>
    </svg>
  );
}
