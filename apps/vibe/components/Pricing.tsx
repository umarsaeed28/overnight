import { Tick } from "@oqa/ui";
import { Led } from "./Ornaments";

type Plan = {
  name: string;
  price: string;
  unit: string;
  body: string;
  points: string[];
  note: { led: boolean; text: string };
};

const plans: Plan[] = [
  {
    name: "One run",
    price: "$50",
    unit: "one time",
    body: "A single full check of your app. Nothing is handed off to your repo.",
    points: ["One complete run", "The report, with a fix prompt for each bug"],
    note: { led: true, text: "Early access" },
  },
  {
    name: "Monthly",
    price: "$150",
    unit: "per month",
    body: "Your own portal, with your runs and everything we set up for you.",
    points: [
      "A portal with every run and result",
      "Nightly runs and the morning email",
      "Your tests in your own GitHub repo",
    ],
    note: { led: true, text: "Early access" },
  },
  {
    name: "In your sandbox",
    price: "Custom",
    unit: "for companies and startups",
    body: "We deploy the same test agents inside your sandbox environment, so you can run your tests in your own time.",
    points: [
      "We maintain the agents afterwards",
      "A person is always in the loop to maintain and customize them",
      "Add your BRDs and other internal knowledge and the agents build a RAG system from it",
    ],
    note: { led: false, text: "A service, scoped with you" },
  },
];

export function Pricing() {
  return (
    <section aria-labelledby="pricing" className="mx-auto w-full max-w-7xl px-4 pb-32 sm:px-6 md:pb-56">
      <h2 id="pricing" className="vc-display text-[clamp(2.25rem,4.4vw,3.75rem)]">
        Pricing.
      </h2>
      <p className="text-ink-soft mt-6 max-w-[52ch] text-xl font-light">
        The two plans are in early access, so the details may change before launch.
      </p>

      <ul className="mt-14 grid gap-5 md:grid-cols-3 md:gap-6">
        {plans.map((plan) => (
          <li key={plan.name} className="nm nm-emerge flex flex-col p-6 sm:p-7 [--r:1.25rem]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-normal tracking-[-0.01em]">{plan.name}</h3>
              <span className="text-ink-soft inline-flex items-center gap-2 text-xs">
                {plan.note.led && <Led />}
                {plan.note.text}
              </span>
            </div>

            <p className="mt-8 flex flex-wrap items-baseline gap-x-3">
              <span className="vc-display text-[clamp(2.5rem,3.6vw,3.25rem)] leading-[0.95]">{plan.price}</span>
              <span className="text-ink-soft text-sm font-light">{plan.unit}</span>
            </p>

            <p className="text-ink-soft mt-5 text-base font-light">{plan.body}</p>

            <ul className="border-line mt-6 space-y-2.5 border-t pt-5 text-sm">
              {plan.points.map((point) => (
                <li key={point} className="flex items-start gap-2.5 font-light">
                  <Tick className="text-accent-text mt-0.5 h-4 w-4 shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <p className="mt-12">
        <a
          href="#try"
          className="nm-key nm-press inline-flex min-h-14 items-center px-9 text-lg font-medium [--r:0.9rem]"
        >
          Paste your link
        </a>
      </p>
    </section>
  );
}
