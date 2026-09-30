interface KumoProps {
  className?: string;
  fill?: string;
  outlined?: boolean;
}

/**
 * Kumo, a stylised cloud band. Rounded lobes on top and a softly scalloped
 * underside, the way clouds are drawn in ukiyo e rather than as a bubble.
 */
export function Kumo({ className, fill = "var(--color-white)", outlined = true }: KumoProps) {
  return (
    <svg
      viewBox="0 0 200 76"
      className={className}
      aria-hidden
      focusable="false"
      role="presentation"
    >
      <path
        d="M28 62
           C10 62 4 44 20 38
           C18 22 36 13 49 22
           C56 5 84 3 93 19
           C105 7 128 10 133 26
           C151 18 171 29 169 46
           C186 44 196 54 190 62
           C182 62 178 57 172 57
           C166 57 162 62 154 62
           C146 62 142 57 136 57
           C130 57 126 62 118 62
           C110 62 106 57 100 57
           C94 57 90 62 82 62
           C74 62 70 57 64 57
           C58 57 54 62 46 62
           C38 62 36 62 28 62 Z"
        fill={fill}
        stroke={outlined ? "var(--color-ink)" : "none"}
        strokeOpacity="0.3"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
