import { DemoButton } from "./DemoButton";
import { EmailCapture } from "./EmailCapture";
import { HeroArt, HeroArtMobile } from "./HeroArt";

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden pb-28 pt-24 sm:pb-36 sm:pt-40">
      <HeroArt />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <HeroArtMobile />

          <p className="mt-6 font-heading text-[15px] uppercase tracking-[0.18em] text-softink sm:mt-0">
            QA that works the night shift
          </p>

          <h1 className="mt-5 text-[40px] leading-[1.06] tracking-tight text-ink sm:text-[54px] lg:text-hero">
            Ship at dusk.
            <br />
            Wake up to answers.
          </h1>

          <p className="mt-6 max-w-xl text-[19px] text-softink">
            AI agents test your app overnight. Our engineers check every finding. Your report is
            ready by 7am.
          </p>

          <div className="mt-9 flex flex-col gap-4">
            <div>
              <DemoButton>Book a 30 min demo</DemoButton>
            </div>
            <EmailCapture section="hero" />
          </div>

          <p className="mt-6 text-[15px] text-softink">
            No new hires. No setup sprint. Read only access.
          </p>
        </div>
      </div>
    </section>
  );
}
