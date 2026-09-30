import { Wordmark } from "@oqa/ui";
import { Scene } from "./Scene";
import { UrlForm } from "./UrlForm";

export function Hero() {
  return (
    <header className="relative isolate min-h-[100svh] overflow-hidden">
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 md:pb-32">
        <Wordmark className="text-xl md:text-2xl" />

        <div className="mt-16 md:mt-28 md:max-w-[58%]">
          <h1 className="vc-display text-[clamp(2.6rem,6.6vw,5.75rem)]">Your app, checked every night.</h1>
          <p className="text-ink-soft mt-10 max-w-[40ch] text-xl font-light md:text-2xl">
            Paste your link. We write the tests, run them while you sleep, and email you what
            broke in plain English.
          </p>
          <UrlForm />
        </div>
      </div>

      {/* The stage sits behind and to the right; the headline runs across its edge. */}
      <div className="pointer-events-none relative mx-auto mt-6 w-[min(100%,34rem)] md:absolute md:-right-[5%] md:top-[2%] md:mt-0 md:w-[64%] md:max-w-none">
        <Scene variant="hero" />
      </div>
    </header>
  );
}
