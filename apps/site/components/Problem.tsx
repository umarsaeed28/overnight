import { CoverageIcon, FlakyIcon, HiringIcon } from "./art/Icons";
import { Reveal } from "./ui/Reveal";
import { Watermark } from "./ui/Watermark";

const problems = [
  {
    Icon: FlakyIcon,
    title: "Flaky tests",
    body: "Engineers lose the first hour of the day rerunning red builds.",
  },
  {
    Icon: CoverageIcon,
    title: "Thin coverage",
    body: "Features ship faster than tests get written.",
  },
  {
    Icon: HiringIcon,
    title: "Slow hiring",
    body: "A senior QA hire takes months. Bugs do not wait.",
  },
];

export function Problem() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Watermark
          kanji="夕"
          className="-top-8 left-6 text-[180px] sm:-top-12 sm:text-[240px]"
        />

        <Reveal>
          <h2 className="relative max-w-xl text-[28px] leading-[1.15] tracking-tight text-ink sm:text-section">
            Your mornings are too expensive.
          </h2>
        </Reveal>

        <div className="relative mt-14 grid gap-6 sm:grid-cols-3 sm:gap-7">
          {problems.map(({ Icon, title, body }, index) => (
            <Reveal key={title} delay={index * 0.08}>
              <div className="card-surface h-full p-7">
                <Icon className="h-10 w-10" />
                <h3 className="mt-6 text-[21px] tracking-tight text-ink">{title}</h3>
                <p className="mt-3 text-[17px] text-softink">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
