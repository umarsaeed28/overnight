interface SunriseEnsoProps {
  className?: string;
}

/**
 * The same enso stroke, half risen above the horizon, with light rays in
 * Kinako. Closes the dusk to dawn story in the final section.
 */
export function SunriseEnso({ className }: SunriseEnsoProps) {
  return (
    <svg
      viewBox="0 0 320 180"
      className={className}
      aria-hidden
      focusable="false"
      role="presentation"
    >
      <defs>
        <clipPath id="sunrise-horizon">
          <rect x="0" y="0" width="320" height="150" />
        </clipPath>
      </defs>

      <g stroke="var(--color-kinako)" strokeWidth="3" strokeLinecap="round" opacity="0.9">
        <path d="M160 26 L160 4" />
        <path d="M104 44 L92 25" />
        <path d="M216 44 L228 25" />
        <path d="M70 86 L48 78" />
        <path d="M250 86 L272 78" />
      </g>

      <g clipPath="url(#sunrise-horizon)">
        <circle cx="160" cy="150" r="66" fill="var(--color-kinako)" />
        <path
          d="M212 104 C232 124 234 152 224 170 C208 196 112 196 96 170 C86 152 88 124 108 104 C124 88 148 82 162 82 C176 82 198 90 210 102"
          fill="none"
          stroke="var(--color-ink)"
          strokeOpacity="0.45"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>

      <path
        d="M4 150 C70 144 118 156 168 150 C214 145 268 152 316 148"
        fill="none"
        stroke="var(--color-ink)"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
