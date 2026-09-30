"use client";

import { useRef, type ReactNode } from "react";

/**
 * Tilts its child toward the pointer, like an object held in the hand, and moves a glare
 * across it (children opt in with the `glare` class). Off under reduced motion.
 */
export function Tilt({ children, className = "", max = 7 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--tx", ((x - 0.5) * 2 * max).toFixed(2));
    el.style.setProperty("--ty", ((y - 0.5) * 2 * max).toFixed(2));
    el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
  }
  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tx", "0");
    el.style.setProperty("--ty", "0");
    el.style.setProperty("--gx", "30%");
    el.style.setProperty("--gy", "10%");
  }

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={`tilt ${className}`}>
      {children}
    </div>
  );
}
