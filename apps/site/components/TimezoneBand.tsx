import { CrescentMoon } from "./art/Icons";
import { Stars } from "./art/Stars";
import { Reveal } from "./ui/Reveal";

export function TimezoneBand() {
  return (
    <section className="relative isolate overflow-hidden bg-sora/70 py-24 sm:py-28">
      <Stars className="absolute inset-0" count={22} />
      <CrescentMoon
        aria-hidden
        className="pointer-events-none absolute right-6 top-8 w-16 opacity-80 sm:right-16 sm:top-12 sm:w-24"
      />

      <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
        <Reveal>
          <h2 className="text-[28px] leading-[1.15] tracking-tight text-ink sm:text-section">
            We work while you sleep.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[19px] text-softink">
            Our team runs your night shift from the other side of the world, so answers arrive
            with your coffee.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
