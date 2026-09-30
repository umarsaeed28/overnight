"use client";

import { useEffect, useState } from "react";
import { DemoButton } from "./DemoButton";

/** Mobile only. Appears once the hero has scrolled away. */
export function StickyDemoBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-ink/[0.08] bg-white/85 px-5 py-3 backdrop-blur-md transition-opacity duration-300 motion-reduce:transition-none sm:hidden ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <DemoButton className="w-full">Book a demo</DemoButton>
    </div>
  );
}
