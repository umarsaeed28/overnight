interface EnsoMoonProps {
  className?: string;
  /** Fill for the disc. Defaults to the Kinako moon used in the hero. */
  fill?: string;
  /** Scales the brush weight. 1 is the hero moon, smaller suits the logo. */
  weight?: number;
}

/**
 * An enso: one brush stroke, left slightly open, thicker where the brush
 * pressed and thinner where it lifted. Three layered arcs at different radii
 * give the wobble, so the circle never looks machine drawn.
 */
export function EnsoMoon({ className, fill = "var(--color-kinako)", weight = 1 }: EnsoMoonProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      aria-hidden
      focusable="false"
      role="presentation"
    >
      <circle cx="99" cy="101" r="79" fill={fill} />

      <g
        fill="none"
        stroke="var(--color-ink)"
        strokeLinecap="round"
        transform="rotate(-24 100 100)"
      >
        {/* the body of the stroke, where the brush sat heaviest */}
        <path
          d="M164 62 C181 98 170 145 134 168 C97 191 49 183 24 151 C0 120 4 72 33 45 C52 27 78 17 104 19"
          strokeWidth={3.2 * weight}
          strokeOpacity="0.82"
        />
        {/* a drier second pass, just off the first */}
        <path
          d="M167 71 C179 104 167 142 133 163 C99 184 55 177 30 149"
          strokeWidth={1.3 * weight}
          strokeOpacity="0.3"
        />
        {/* the lifted tail, thinning into the paper */}
        <path
          d="M104 19 C121 21 137 29 150 42"
          strokeWidth={1.6 * weight}
          strokeOpacity="0.32"
        />
      </g>
    </svg>
  );
}
