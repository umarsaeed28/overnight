import type { SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Icon({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="var(--color-ink)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      role="presentation"
      {...props}
    >
      {children}
    </svg>
  );
}

/** A signal that will not settle. */
export function FlakyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 26 L11 26 L14 17 L18 30 L22 12 L26 26 L36 26" />
      <circle cx="22" cy="12" r="2.2" fill="var(--color-hanko)" stroke="none" />
    </Icon>
  );
}

/** A shape only partly filled in. */
export function CoverageIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6" y="8" width="28" height="24" rx="5" strokeDasharray="5 4" />
      <path d="M6 20 L20 20" stroke="var(--color-ink)" />
      <path d="M11 14 L16 14 M11 26 L15 26" strokeOpacity="0.45" />
    </Icon>
  );
}

/** A slow clock beside an empty chair. */
export function HiringIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="15" cy="14" r="6" />
      <path d="M5 33 C6 25 11 22 15 22 C17 22 19 22.6 21 24" />
      <circle cx="29" cy="27" r="8" />
      <path d="M29 23 L29 27 L32 29" />
    </Icon>
  );
}

/** One way arrow into a door. */
export function ReadOnlyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="7" y="9" width="17" height="22" rx="4" />
      <path d="M28 20 L36 20 M32 16 L36 20 L32 24" />
      <path d="M13 20 L18 20" strokeOpacity="0.45" />
    </Icon>
  );
}

/** A quotation anchored to a line. */
export function CitationIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 10 L32 10 M8 17 L26 17 M8 24 L20 24" />
      <circle cx="28" cy="28" r="6" />
      <path d="M32.4 32.4 L36 36" />
    </Icon>
  );
}

/** Two people, one checking the other's work. */
export function PeopleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="14" cy="13" r="5" />
      <path d="M5 31 C6 24 10 21 14 21 C18 21 22 24 23 31" />
      <circle cx="28" cy="16" r="4" />
      <path d="M24 31 C25 26 27 24 30 24 C33 24 35 26 36 30" strokeOpacity="0.5" />
    </Icon>
  );
}

/** A key behind a shut lock. */
export function SecretsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="18" width="22" height="15" rx="4" />
      <path d="M14 18 V14 A6 6 0 0 1 26 14 V18" />
      <path d="M20 24 L20 28" />
    </Icon>
  );
}

/** A sun dipping below the horizon. */
export function SunsetIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {/* Warm and on its way down. */}
      <path d="M11 27 A9 9 0 0 1 29 27 Z" fill="var(--color-sakura)" />
      <path d="M4 27 L36 27" />
      <path d="M20 7 L20 15 M16 11 L20 15 L24 11" strokeOpacity="0.5" />
      <path d="M9 32 L18 32 M23 32 L32 32" strokeOpacity="0.28" />
    </Icon>
  );
}

/** A crescent among stars. */
export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {/* A crescent is the difference of two discs, not a single arc. */}
      <defs>
        <mask id="moon-icon-crescent">
          <circle cx="21" cy="20" r="12" fill="#FFFFFF" />
          <circle cx="29" cy="14" r="11" fill="#000000" />
        </mask>
      </defs>
      <circle
        cx="21"
        cy="20"
        r="12"
        fill="var(--color-kinako)"
        mask="url(#moon-icon-crescent)"
        stroke="none"
      />
      <path d="M7 9 L7 13 M5 11 L9 11" strokeOpacity="0.45" />
    </Icon>
  );
}

/** A sun clearing the horizon. */
export function SunriseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11 27 A9 9 0 0 1 29 27 Z" fill="var(--color-kinako)" />
      <path d="M4 27 L36 27" />
      <path d="M20 4 L20 10 M7 11 L11 15 M33 11 L29 15" strokeOpacity="0.6" />
      <path d="M9 32 L18 32 M23 32 L32 32" strokeOpacity="0.28" />
    </Icon>
  );
}

/** A slim crescent for the timezone band. */
export function CrescentMoon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      aria-hidden
      focusable="false"
      role="presentation"
      {...props}
    >
      <defs>
        <mask id="crescent-moon-shape">
          <circle cx="40" cy="42" r="30" fill="#FFFFFF" />
          <circle cx="58" cy="28" r="27" fill="#000000" />
        </mask>
      </defs>
      <circle
        cx="40"
        cy="42"
        r="30"
        fill="var(--color-kinako)"
        mask="url(#crescent-moon-shape)"
      />
    </svg>
  );
}
