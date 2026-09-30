"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Crane } from "./art/Crane";
import { Hanko } from "./art/Hanko";
import { SunriseEnso } from "./art/SunriseEnso";
import { DemoButton } from "./DemoButton";
import { EmailCapture } from "./EmailCapture";
import { Reveal } from "./ui/Reveal";
import { Watermark } from "./ui/Watermark";

export function FinalCta() {
  const reduced = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-kinako/80 to-sakura/70 pb-56 pt-28 sm:pb-64 sm:pt-32">
      <SunriseEnso className="pointer-events-none absolute -bottom-6 left-1/2 w-[520px] max-w-none -translate-x-1/2 opacity-90" />

      {/* The third and last appearance of the mascot, headed for the sunrise. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-36 left-[6%] w-28 sm:bottom-44 sm:w-40"
        animate={reduced ? undefined : { y: [0, -16, 0], x: [0, 18, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      >
        <Crane className="h-auto w-full" fill="var(--color-washi)" />
      </motion.div>

      <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
        <Watermark
          kanji="朝"
          className="left-1/2 top-0 -translate-x-1/2 text-[200px] sm:text-[300px]"
        />

        <Reveal>
          <div className="relative flex items-center justify-center gap-4">
            <h2 className="text-[28px] leading-[1.15] tracking-tight text-ink sm:text-section">
              Sleep on it. We will test it.
            </h2>
            <Hanko kanji="朝" rotate={7} className="h-10 w-10 text-[19px]" />
          </div>

          <p className="mx-auto mt-6 max-w-lg text-[19px] text-softink">
            Book a 30 minute demo, or leave your email for early access.
          </p>

          <div className="mt-10 flex flex-col items-center gap-6">
            <DemoButton>Book a 30 min demo</DemoButton>
            <div className="w-full max-w-md">
              <EmailCapture section="footer" align="center" />
            </div>
          </div>

          <p className="mt-8 text-[15px] text-softink">
            <a
              href="mailto:hello@overnightqa.com"
              className="rounded-full underline decoration-ink/25 underline-offset-4 hover:decoration-ink/60"
            >
              Prefer email? hello@overnightqa.com
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
