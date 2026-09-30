import { CitationIcon, PeopleIcon, ReadOnlyIcon, SecretsIcon } from "./art/Icons";
import { Reveal } from "./ui/Reveal";

const promises = [
  {
    Icon: ReadOnlyIcon,
    title: "Read only. Always.",
    body: "We never write to your systems.",
  },
  {
    Icon: CitationIcon,
    title: "Every finding cites its source.",
    body: "Click any result to see the exact line of code or doc behind it.",
  },
  {
    Icon: PeopleIcon,
    title: "People in the loop.",
    body: "QA engineers verify AI verdicts before they reach you.",
  },
  {
    Icon: SecretsIcon,
    title: "Your secrets stay secret.",
    body: "Credentials are scrubbed before any AI sees your code.",
  },
];

export function Trust() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <Reveal>
          <h2 className="text-[28px] leading-[1.15] tracking-tight text-ink sm:text-section">
            Built to be trusted.
          </h2>
        </Reveal>

        <ul className="mt-16 space-y-14">
          {promises.map(({ Icon, title, body }, index) => (
            <Reveal as="li" key={title} delay={index * 0.06} className="flex gap-6">
              <Icon className="mt-1 h-9 w-9 shrink-0" />
              <div>
                <h3 className="text-[20px] tracking-tight text-ink">{title}</h3>
                <p className="mt-2 text-[17px] text-softink">{body}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
