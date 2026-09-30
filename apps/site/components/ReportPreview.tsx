"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Crane } from "./art/Crane";
import { CountUp } from "./ui/CountUp";
import { Reveal } from "./ui/Reveal";

const rows = [
  { label: "Real bugs", count: 2, dot: "bg-hanko" },
  { label: "Needs a look", count: 1, dot: "bg-kinako" },
  { label: "Flaky tests", count: 5, dot: "bg-sora" },
  { label: "New tests written", count: 14, dot: "bg-matcha" },
];

export function ReportPreview() {
  const [open, setOpen] = useState(false);
  const detailId = useId();
  const reduced = useReducedMotion();

  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <Reveal>
          <h2 className="text-[28px] leading-[1.15] tracking-tight text-ink sm:text-section">
            Your coffee, and one clear report.
          </h2>
          <p className="mt-5 max-w-xl text-[19px] text-softink">
            Everything that happened overnight, sorted by what needs you first.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="relative mt-20">
          {/* The crane comes to rest on the top edge of the card. */}
          <motion.div
            aria-hidden
            className="absolute -top-14 right-6 z-10 w-32 sm:right-12 sm:w-40"
            animate={reduced ? undefined : { y: [0, -4, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <Crane className="h-auto w-full" />
          </motion.div>

          <div className="card-surface relative p-6 sm:p-9">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[20px] tracking-tight text-ink">Morning report</h3>
              <span className="text-[15px] text-softink">7:02am</span>
            </div>

            <ul className="mt-7 divide-y divide-ink/[0.07]">
              {rows.map(({ label, count, dot }, index) => (
                <li key={label} className="py-4">
                  {index === 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setOpen((previous) => !previous)}
                        aria-expanded={open}
                        aria-controls={detailId}
                        className="flex w-full items-center justify-between gap-4 rounded-2xl text-left"
                      >
                        <span className="flex items-center gap-3">
                          <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                          <span className="text-[17px] text-ink">{label}</span>
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="font-heading text-[20px] text-ink">
                            <CountUp to={count} />
                          </span>
                          <svg
                            aria-hidden
                            focusable="false"
                            role="presentation"
                            viewBox="0 0 16 16"
                            className={`h-4 w-4 text-softink transition-transform motion-reduce:transform-none ${open ? "rotate-180" : ""}`}
                          >
                            <path
                              d="M3 6 L8 11 L13 6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </button>

                      {open ? (
                        <div id={detailId} className="mt-4 rounded-2xl bg-washi/80 p-4">
                          <p className="text-[16px] text-ink">
                            Checkout fails when the cart has a discount code.
                          </p>
                          <p className="mt-3">
                            <span className="inline-flex rounded-full bg-sora/70 px-3 py-1 text-[13px] text-ink">
                              checkout.spec.ts, line 42
                            </span>
                          </p>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-3">
                        <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                        <span className="text-[17px] text-ink">{label}</span>
                      </span>
                      <span className="font-heading text-[20px] text-ink">
                        <CountUp to={count} />
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <p className="mt-6 text-right text-[13px] uppercase tracking-[0.14em] text-softink">
              Sample report
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
