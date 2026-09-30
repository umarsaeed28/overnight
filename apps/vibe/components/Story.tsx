import { Scene } from "./Scene";

const steps = [
  {
    title: "Paste your URL",
    body: "Any public link works: a Vercel, Lovable, Bolt, Replit or Netlify address, or your own domain.",
  },
  {
    title: "We explore your app and write your tests into your own GitHub repo",
    body: "We click through it like a new visitor would, then save what we learned as tests you can read.",
  },
  {
    title: "Every night we run them and email you in plain English",
    body: "You get the real bugs first, written so you can paste them straight into your AI builder.",
  },
];

/**
 * A pinned stage that plays as you scroll: the tiles come apart, get their tests, then a
 * beam sweeps up and stops on the bug. Without scroll timelines or with reduced motion it
 * is a plain section with a static scene and the three steps in a list.
 */
export function Story() {
  return (
    <section aria-labelledby="how" className="story border-line border-y">
      <div className="story-stage relative flex items-center">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 py-20 sm:px-8 md:grid-cols-12 md:gap-10 md:py-0">
          <div className="md:col-span-5">
            <h2 id="how" className="vc-display text-[clamp(2.4rem,6vw,5.5rem)]">
              How it works
            </h2>
            <ol className="steps mt-6 space-y-8 md:mt-14">
              {steps.map((step, i) => (
                <li key={step.title} className="step max-w-[34rem]">
                  <span
                    aria-hidden="true"
                    className="text-accent-text block text-2xl font-light tabular-nums"
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-xl font-normal leading-tight tracking-[-0.02em] md:text-3xl">
                    {step.title}
                  </h3>
                  <p className="text-ink-soft mt-4 text-lg font-light">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="pointer-events-none md:col-span-7">
            <Scene variant="story" className="scene--story" />
          </div>
        </div>
        <div aria-hidden="true" className="absolute inset-x-8 bottom-8 hidden md:block">
          <div className="bg-line h-px">
            <div className="story-progress bg-ink h-px w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
