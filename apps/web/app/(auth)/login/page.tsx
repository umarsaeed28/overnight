import { auth, configuredProviders, signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";

export const metadata = { title: "Sign in · Overnight QA" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { sent, error } = await searchParams;
  const hasEmail = configuredProviders.some((p) => p.id === "nodemailer");
  const hasEntra = configuredProviders.some((p) => p.id === "microsoft-entra-id");

  return (
    <main className="flex h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-5">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Overnight QA</h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            Sign in to read the knowledge layer for your application.
          </p>
        </div>

        {error ? (
          <p className="rounded-md border border-[var(--border)] bg-[var(--muted)] p-2.5 text-xs text-[var(--color-criticality-high)]">
            That sign-in did not complete. Request a new link and try again.
          </p>
        ) : null}

        {sent ? (
          <p className="rounded-md border border-[var(--border)] bg-[var(--muted)] p-2.5 text-xs">
            Check your email for a sign-in link. It expires in 24 hours.
          </p>
        ) : null}

        {hasEmail ? (
          <form
            className="space-y-2"
            action={async (formData: FormData) => {
              "use server";
              await signIn("nodemailer", {
                email: String(formData.get("email") ?? ""),
                redirectTo: "/",
              });
            }}
          >
            <label className="block text-xs font-medium" htmlFor="email">
              Work email
            </label>
            <Input id="email" name="email" type="email" required placeholder="you@company.com" />
            <Button type="submit" variant="primary" className="w-full">
              Email me a sign-in link
            </Button>
          </form>
        ) : null}

        {hasEmail && hasEntra ? (
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
            <span className="h-px flex-1 bg-[var(--border)]" />
            or
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>
        ) : null}

        {hasEntra ? (
          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", { redirectTo: "/" });
            }}
          >
            <Button type="submit" className="w-full">
              Sign in with Microsoft
            </Button>
          </form>
        ) : null}

        {!hasEmail && !hasEntra ? (
          <p className="rounded-md border border-[var(--border)] bg-[var(--muted)] p-2.5 text-xs">
            No sign-in method is configured. Set <code>SMTP_URL</code> and{" "}
            <code>AUTH_EMAIL_FROM</code>, or the <code>ENTRA_*</code> values, then restart.
          </p>
        ) : null}
      </div>
    </main>
  );
}
