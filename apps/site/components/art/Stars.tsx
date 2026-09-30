"use client";

import { motion, useReducedMotion } from "framer-motion";

interface StarsProps {
  className?: string;
  count?: number;
}

/** Deterministic scatter, so the server and the client agree on every star. */
function scatter(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const golden = (i * 137.508) % 100;
    return {
      left: golden,
      top: ((i * 61.803) % 90) + 3,
      size: 10 + ((i * 7) % 7),
      delay: (i % 9) * 0.7,
      kinako: i % 2 === 0,
    };
  });
}

function FourPointStar({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" fill={color} />
    </svg>
  );
}

/** Tiny four point stars for the night portion of the page. */
export function Stars({ className, count = 24 }: StarsProps) {
  const reduced = useReducedMotion();
  const stars = scatter(count);

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 ${className ?? ""}`}>
      {stars.map((star, index) => (
        <motion.span
          key={index}
          className="absolute"
          style={{ left: `${star.left}%`, top: `${star.top}%` }}
          initial={{ opacity: 0.6 }}
          animate={reduced ? { opacity: 0.7 } : { opacity: [0.45, 1, 0.45] }}
          transition={
            reduced
              ? { duration: 0.4 }
              : { duration: 4.5 + (index % 5), repeat: Infinity, delay: star.delay, ease: "easeInOut" }
          }
        >
          <FourPointStar
            size={star.size}
            color={star.kinako ? "var(--color-kinako)" : "var(--color-white)"}
          />
        </motion.span>
      ))}
    </div>
  );
}
