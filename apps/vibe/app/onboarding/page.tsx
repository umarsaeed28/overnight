import { SubmitUrl } from "@oqa/contracts";
import { Wordmark } from "@oqa/ui";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Setup: Vibe Check",
  robots: { index: false },
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string | string[] }>;
}) {
  const { url } = await searchParams;
  // The query string is user input: validate it again, and only ever render it as text.
  const parsed = SubmitUrl.safeParse(Array.isArray(url) ? url[0] : (url ?? ""));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Link href="/" className="text-ink w-fit text-3xl">
        <Wordmark />
      </Link>
      <div>
        <h1 className="vc-display text-5xl md:text-7xl">Onboarding coming next</h1>
        {parsed.success ? (
          <>
            <p className="text-ink-soft mt-4 text-lg">We'll check this app every night:</p>
            <p className="nm-inset mt-5 overflow-x-auto p-4 [--r:1.5rem]">
              <code className="break-all">{parsed.data}</code>
            </p>
          </>
        ) : (
          <p className="text-ink-soft mt-4 text-lg">
            That link didn't come through.{" "}
            <Link href="/" className="text-accent-text font-semibold underline underline-offset-4">
              Paste it again
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
