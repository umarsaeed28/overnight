type TickProps = { className?: string };

/** The tick: the one shape the brand is built from. Decorative. */
export function Tick({ className }: TickProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.6 12.6 9.6 17.4 19.4 6.6" />
    </svg>
  );
}
