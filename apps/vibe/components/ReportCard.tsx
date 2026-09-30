import { Tick } from "@oqa/ui";
import { CopyPrompt } from "./CopyPrompt";
import { Led } from "./Ornaments";
import { Tilt } from "./Tilt";

/** What a bug hands you: the same markdown your coding agent can act on as written. */
const PROMPT = `# Fix: Pay button unreachable on phones

## What broke
On screens narrower than 480px the Pay button on the last
checkout step sits underneath the cookie banner, so taps
never reach it. It works on a laptop.

## Reproduce
1. Open /checkout at 375 x 812
2. Add any product and continue to the last step
3. Tap "Pay"

## Expected
The payment form submits.

## Actual
Nothing happens. The tap lands on the cookie banner.

## Test
features/checkout.feature: "A shopper pays"

## Constraints
Change the layout only. Keep the cookie banner.`;

export function ReportCard() {
  return (
    <section aria-labelledby="report" className="mx-auto w-full max-w-7xl px-4 py-32 sm:px-6 md:py-56">
      <div className="max-w-3xl">
        <h2 id="report" className="vc-display text-[clamp(2.25rem,4.4vw,3.75rem)]">
          Your morning report.
        </h2>
        <p className="text-ink-soft mt-7 max-w-[52ch] text-xl md:text-2xl">
          One email, ready before your first coffee. The real bugs come first, with what you would
          see if you tried it yourself, and a prompt your coding agent can act on as written.
        </p>
        <p className="text-ink-soft mt-4 text-sm">An example, not real data.</p>
      </div>

      <div className="mt-16 grid grid-cols-1 items-start gap-14 md:mt-24 md:grid-cols-12 md:gap-12">
        <div className="min-w-0 md:col-span-6">
          <h3 className="text-2xl font-medium leading-tight tracking-[-0.02em] md:text-3xl">
            Every bug comes with a prompt.
          </h3>
          <p className="text-ink-soft mt-4 max-w-[46ch] text-lg">
            Plain markdown: what broke, how to reproduce it, what you expected, which test covers
            it. Copy it into Claude Code, Codex, Cursor or any AI builder and let it fix the bug.
          </p>
          <div className="mt-8">
            <CopyPrompt filename="fix-checkout-pay-button.md" text={PROMPT} />
          </div>
        </div>

        <div className="flex min-w-0 justify-center md:col-span-6 md:justify-end md:pr-[4%]">
          <div className="phone-rise">
            <Tilt max={4}>
              <article aria-label="Example nightly email on a phone" className="phone glare">
                <div className="phone-screen">
                  <div className="phone-notch" aria-hidden="true" />
                  <div className="px-5 pb-6 pt-12 text-[0.92rem] leading-snug">
                    <div className="flex items-center gap-3">
                      <span className="nm-key grid h-10 w-10 shrink-0 place-items-center [--r:0.8rem]">
                        <Tick className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-ink-soft text-xs font-semibold">Vibe Check, 6:02 am</p>
                        <p className="text-[1.02rem] font-medium leading-tight tracking-[-0.02em]">
                          2 real bugs, 1 test updated, 47 passed
                        </p>
                      </div>
                    </div>

                    <div className="nm-sm mt-5 p-4 [--r:1rem]">
                      <h3 className="flex items-center gap-2 text-lg font-semibold leading-tight tracking-[-0.02em]">
                        <Led tone="rose" />
                        Paying fails on phones
                      </h3>
                      <p className="mt-2">
                        On a phone-sized screen the Pay button sits underneath the cookie banner,
                        so taps never reach it. It works on a laptop.
                      </p>
                      <dl className="mt-3 space-y-1">
                        <div className="flex gap-1.5">
                          <dt className="shrink-0 font-medium">Where:</dt>
                          <dd>Checkout, last step</dd>
                        </div>
                        <div className="flex gap-1.5">
                          <dt className="shrink-0 font-medium">Try this:</dt>
                          <dd>Ask your builder to keep the Pay button above the cookie banner.</dd>
                        </div>
                      </dl>
                    </div>

                    <ul className="mt-5 space-y-3">
                      <li>
                        <span className="text-bug-text font-semibold">Bug:</span> the
                        reset-password email link opens a blank page.
                      </li>
                      <li>
                        <span className="font-medium">Test updated:</span> sign-up now expects the
                        new &ldquo;Welcome aboard&rdquo; heading.
                      </li>
                      <li className="flex items-start gap-2">
                        <Tick className="text-pass mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          <span className="text-pass font-medium">47 checks passed</span>, including
                          sign-in, search and the cart.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </article>
            </Tilt>
          </div>
        </div>
      </div>
    </section>
  );
}
