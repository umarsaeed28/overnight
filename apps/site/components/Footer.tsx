import { EnsoMoon } from "./art/EnsoMoon";
import { DemoButton } from "./DemoButton";

export function Footer() {
  return (
    <footer className="border-t border-ink/[0.08] bg-washi py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-5 text-center sm:px-8 md:flex-row md:justify-between md:text-left">
        <div className="flex items-center gap-3">
          <EnsoMoon className="h-8 w-8" weight={0.7} />
          <span className="font-heading text-[17px] tracking-tight text-ink">Overnight QA</span>
        </div>

        <p className="text-[16px] text-softink">QA that works the night shift.</p>

        <div className="flex flex-col items-center gap-3 md:items-end">
          <p className="text-[15px] text-softink">© 2026 Overnight QA</p>
          <p className="flex items-center gap-3 text-[15px]">
            <DemoButton variant="link">Book a demo</DemoButton>
            <span aria-hidden className="text-softink/60">
              ·
            </span>
            <a
              href="/privacy"
              className="rounded-full text-softink underline decoration-ink/20 underline-offset-4 hover:text-ink"
            >
              Privacy
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
