"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Crane } from "./art/Crane";
import { EnsoMoon } from "./art/EnsoMoon";
import { Kumo } from "./art/Kumo";
import { Seigaiha } from "./art/Seigaiha";
import { Stars } from "./art/Stars";

/**
 * The hero scene: an enso moon, clouds drifting at slightly different rates,
 * a band of seigaiha along the base, and the crane gliding a slow loop.
 */
export function HeroArt() {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();

  const nearCloud = useTransform(scrollY, [0, 600], [0, reduced ? 0 : 60]);
  const farCloud = useTransform(scrollY, [0, 600], [0, reduced ? 0 : 26]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Stars className="opacity-70" count={22} />

      {/* On small screens the scene moves above the headline instead. */}
      <div className="hidden sm:block">
        <div className="absolute right-[6%] top-[14%] w-[240px] lg:right-[9%] lg:w-[300px]">
          <EnsoMoon className="h-auto w-full" />
        </div>

        <motion.div style={{ x: farCloud }} className="absolute right-[30%] top-[7%] w-[220px]">
          <Kumo className="h-auto w-full" fill="var(--color-white)" />
        </motion.div>

        <motion.div style={{ x: nearCloud }} className="absolute right-[10%] top-[46%] w-[220px]">
          <Kumo className="h-auto w-full" fill="var(--color-sakura)" />
        </motion.div>

        <motion.div
          style={{ x: farCloud }}
          className="absolute left-[-3%] top-[5%] hidden w-[200px] lg:block"
        >
          <Kumo className="h-auto w-full" fill="var(--color-white)" outlined={false} />
        </motion.div>

        <GlidingCrane reduced={Boolean(reduced)} />
      </div>

      <div className="absolute inset-x-0 bottom-0">
        <Seigaiha id="hero-waves" scale={80} opacity={0.8} className="h-28 w-full sm:h-36" />
      </div>
    </div>
  );
}

/** The same scene, stacked above the headline where there is no room beside it. */
export function HeroArtMobile() {
  const reduced = useReducedMotion();

  return (
    <div aria-hidden className="relative h-44 w-full sm:hidden">
      <div className="absolute left-[2%] top-3 w-[150px]">
        <Kumo className="h-auto w-full" fill="var(--color-white)" />
      </div>

      <div className="absolute right-[4%] top-0 w-[150px]">
        <EnsoMoon className="h-auto w-full" />
      </div>

      <div className="absolute bottom-2 right-[24%] w-[120px]">
        <Kumo className="h-auto w-full" fill="var(--color-sakura)" outlined={false} />
      </div>

      <motion.div
        className="absolute bottom-5 left-[6%] w-[104px]"
        animate={reduced ? undefined : { y: [0, -9, 0], x: [0, 12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        <Crane className="h-auto w-full" />
      </motion.div>
    </div>
  );
}

function GlidingCrane({ reduced }: { reduced: boolean }) {
  if (reduced) {
    return (
      <div className="absolute left-[52%] top-[48%] w-[140px]">
        <Crane className="h-auto w-full" />
      </div>
    );
  }

  return (
    <motion.div
      className="absolute top-0 left-0 w-[110px] sm:w-[140px]"
      // A long shallow arc across the scene, once every eighteen seconds.
      animate={{
        x: ["-14vw", "30vw", "64vw", "106vw"],
        y: ["54vh", "41vh", "47vh", "31vh"],
        rotate: [0, -4, 2, -3],
      }}
      transition={{ duration: 18, repeat: Infinity, ease: "linear", times: [0, 0.34, 0.68, 1] }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Crane className="h-auto w-full" />
      </motion.div>
    </motion.div>
  );
}
