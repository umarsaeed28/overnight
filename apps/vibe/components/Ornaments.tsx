import type { CSSProperties } from "react";

/** A small lit dot that breathes. Decorative: pair it with words. */
export function Led({ tone, delay = "0s" }: { tone?: "mint" | "sky" | "rose"; delay?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`led shrink-0 ${tone ? `led--${tone}` : ""}`}
      style={{ "--d": delay } as CSSProperties}
    />
  );
}
