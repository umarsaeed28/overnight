import { Wordmark } from "@oqa/ui";

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6">
      <div className="border-line flex flex-col gap-6 border-t pt-12 md:flex-row md:items-end md:justify-between">
        <div className="text-[clamp(1.75rem,3vw,2.25rem)]">
          <Wordmark />
        </div>
        <p className="text-ink-soft text-base font-light">Your app, checked every night. Early access.</p>
      </div>
    </footer>
  );
}
