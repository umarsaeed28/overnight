import { Reveal } from "./ui/Reveal";

const benefits = [
  {
    tone: "bg-sakura/70",
    title: "Hours",
    body: "Your team starts the day building, not triaging.",
  },
  {
    tone: "bg-sora/70",
    title: "Coverage",
    body: "New tests for the flows that matter most, written against your real code.",
  },
  {
    tone: "bg-matcha/70",
    title: "Headcount",
    body: "A QA team's output without a QA hiring plan.",
  },
  {
    tone: "bg-kinako/70",
    title: "Confidence",
    body: "People review what the AI flags. Nothing reaches you unchecked.",
  },
];

export function Benefits() {
  return (
    <section id="why" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <Reveal>
          <h2 className="text-[28px] leading-[1.15] tracking-tight text-ink sm:text-section">
            What you get back.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 sm:gap-6">
          {benefits.map(({ tone, title, body }, index) => (
            <Reveal key={title} delay={index * 0.07}>
              <div
                className={`h-full rounded-card border border-ink/[0.08] p-8 shadow-[var(--shadow-card)] ${tone}`}
              >
                <h3 className="text-[22px] tracking-tight text-ink">{title}</h3>
                <p className="mt-3 text-[17px] text-softink">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
