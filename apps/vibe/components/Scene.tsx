"use client";

import { useEffect, useRef } from "react";

const LAYERS = [
  { name: "Home", bars: [78, 52] },
  { name: "Sign up", bars: [64, 84] },
  { name: "Cart", bars: [88, 46] },
  { name: "Checkout", bars: [72, 58], bug: true },
  { name: "Thanks", bars: [56, 80] },
] as const;

type SceneProps = {
  /** `hero` sweeps the scan plane on a loop; `story` is driven by the page's scroll timeline. */
  variant: "hero" | "story";
  className?: string;
};

/**
 * Five app screens as glass layers in 3D, with a scan plane passing through them. The
 * layer with the bug lights up as the plane reaches it. Pure CSS 3D; the only script is
 * a small pointer response on the hero, which is skipped under reduced motion.
 */
export function Scene({ variant, className = "" }: SceneProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant !== "hero") return;
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const host = el.closest("header") ?? el;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        el.style.setProperty("--tx", ((x - 0.5) * 2).toFixed(3));
        el.style.setProperty("--ty", ((y - 0.5) * 2).toFixed(3));
        // The light that follows the pointer lives on the hero, behind the scene.
        (host as HTMLElement).style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
        (host as HTMLElement).style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, [variant]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Five screens of an app stacked in 3D. A beam of light passes through them and stops on the checkout screen, which glows because it has a bug."
      className={`scene ${variant === "hero" ? "scene--hero" : ""} ${className}`}
    >
      <div className="stack">
        {LAYERS.map((layer, n) => (
          <div
            key={layer.name}
            className={`layer ${"bug" in layer ? "layer--bug" : ""}`}
            style={{ "--n": n } as React.CSSProperties}
          >
            <span className="tag">{layer.name}</span>
            <span className="chip">{"bug" in layer ? "bug found" : "test"}</span>
            {layer.bars.map((w, i) => (
              <span key={i} className="bar" style={{ width: `${w}%` }} />
            ))}
            <span className="btn" />
          </div>
        ))}
        <div className="scan" />
      </div>
    </div>
  );
}
