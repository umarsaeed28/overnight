"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li";
}

/**
 * Fade and rise 16px, once. With reduced motion it is a plain fade, which is
 * the one kind of animation the accessibility rule still allows.
 */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const reduced = useReducedMotion();
  const Component = motion[as];

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: reduced ? 0.25 : 0.6, delay: reduced ? 0 : delay, ease: "easeOut" }}
    >
      {children}
    </Component>
  );
}
