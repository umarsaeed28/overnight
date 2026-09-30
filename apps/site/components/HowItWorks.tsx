import { MoonIcon, SunriseIcon, SunsetIcon } from "./art/Icons";
import { Reveal } from "./ui/Reveal";
import { Watermark } from "./ui/Watermark";

const steps = [
  {
    Icon: SunsetIcon,
    title: "Dusk. Connect.",
    body: "Link your repo, docs, and tickets. Read only, in minutes.",
  },
  {
    Icon: MoonIcon,
    title: "Night. We learn and test.",
    body: "Agents map your app, run your suite, and write the tests you are missing.",
  },
  {
    Icon: SunriseIcon,
    title: "Dawn. Read the report.",
    body: "Real bugs on top. Flaky tests flagged. Every finding shows its source.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32">
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Watermark
          kanji="夜"
          className="-top-12 right-2 text-[180px] sm:-top-20 sm:text-[280px]"
        />

        <Reveal>
          <h2 className="relative text-[28px] leading-[1.15] tracking-tight text-ink sm:text-section">
            From dusk to dawn.
          </h2>
        </Reveal>

        <ol className="relative mt-16 grid gap-12 sm:grid-cols-3 sm:gap-10">
          {/* The thread the three moments hang from. */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-[27px] top-6 h-[calc(100%-4rem)] w-px bg-ink/10 sm:hidden"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-[16.6%] right-[16.6%] top-[27px] hidden h-px bg-ink/10 sm:block"
          />

          {steps.map(({ Icon, title, body }, index) => (
            <Reveal as="li" key={title} delay={index * 0.1} className="relative pl-20 sm:pl-0">
              <span className="absolute left-0 top-0 flex h-14 w-14 items-center justify-center rounded-full bg-white/80 ring-1 ring-ink/10 sm:relative">
                <Icon className="h-8 w-8" />
              </span>
              <h3 className="mt-0 text-[21px] tracking-tight text-ink sm:mt-7">{title}</h3>
              <p className="mt-3 max-w-xs text-[17px] text-softink">{body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
