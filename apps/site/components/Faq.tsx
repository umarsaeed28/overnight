"use client";

import { useState } from "react";
import { Reveal } from "./ui/Reveal";

const questions = [
  {
    question: "What do you need from us?",
    answer:
      "Read access to your repo. Docs and tickets are optional but make results sharper.",
  },
  {
    question: "Which test frameworks do you support?",
    answer: "Playwright first. Cypress and others on request.",
  },
  {
    question: "How soon do we see results?",
    answer: "Within your first week.",
  },
  {
    question: "Is this another AI testing tool?",
    answer:
      "No. It is a service. AI does the heavy lifting, people check the results, and you get answers instead of dashboards.",
  },
  {
    question: "What does it cost?",
    answer:
      "Plans are monthly and depend on how much of your app we cover. We size it together on the demo call.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <Reveal>
          <h2 className="text-[28px] leading-[1.15] tracking-tight text-ink sm:text-section">
            FAQ
          </h2>
        </Reveal>

        <dl className="mt-12 divide-y divide-ink/[0.08] border-y border-ink/[0.08]">
          {questions.map(({ question, answer }, index) => {
            const open = openIndex === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;

            return (
              <div key={question}>
                <dt>
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(open ? null : index)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span className="font-heading text-[19px] tracking-tight text-ink">
                      {question}
                    </span>
                    <span
                      aria-hidden
                      className={`shrink-0 text-[20px] leading-none text-softink transition-transform motion-reduce:transform-none ${open ? "rotate-45" : ""}`}
                    >
                      +
                    </span>
                  </button>
                </dt>
                <dd
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!open}
                  className="pb-7 pr-10 text-[17px] text-softink"
                >
                  {answer}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
