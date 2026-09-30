import { Tilt } from "./Tilt";

/** Each line of the sample, with the Gherkin keyword picked out. */
const lines: { keyword?: string; text: string; lit?: [string, string] }[] = [
  { keyword: "Feature:", text: " Checkout" },
  { text: "" },
  { keyword: "  Scenario:", text: " A shopper pays" },
  { keyword: "    Given", text: ' "Linen tote" is in my cart', lit: ["26%", "34%"] },
  { keyword: "    When", text: " I pay with a test card", lit: ["33%", "41%"] },
  { keyword: "    Then", text: ' I see "Thanks for your order"', lit: ["40%", "48%"] },
];

export function OwnTests() {
  return (
    <section aria-labelledby="own" className="mx-auto w-full max-w-7xl px-4 pb-32 sm:px-6 md:pb-56">
      <div className="grid grid-cols-1 gap-14 md:grid-cols-12 md:items-center md:gap-12">
        <div className="min-w-0 md:col-span-5">
          <h2 id="own" className="vc-display text-[clamp(2.25rem,4.4vw,3.75rem)]">
            You own the tests.
          </h2>
          <p className="text-ink-soft mt-7 max-w-[42ch] text-xl">
            Every test is a Cucumber feature file in your GitHub repo. It reads like a sentence,
            anyone on your team can follow it, and it stays yours if you ever leave.
          </p>
        </div>
        <figure className="min-w-0 md:col-span-7">
          <Tilt max={3}>
            <pre
              tabIndex={0}
              aria-label="Example Cucumber feature file"
              className="nm-inset border-line relative overflow-x-auto border p-6 text-[0.9rem] leading-loose sm:p-10 sm:text-base [--r:1.25rem]"
            >
              <code>
                {lines.map((line, i) => (
                  <span
                    key={i}
                    className={`block whitespace-pre ${line.lit ? "gline gline--lit" : ""}`}
                    style={line.lit ? ({ "--a": line.lit[0], "--b": line.lit[1] } as React.CSSProperties) : undefined}
                  >
                    {line.keyword && <span className="text-accent-text font-semibold">{line.keyword}</span>}
                    {line.text || (line.keyword ? "" : " ")}
                  </span>
                ))}
              </code>
            </pre>
          </Tilt>
          <figcaption className="text-ink-soft mt-6 text-sm">
            <code>features/checkout.feature</code>, in your repo
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
