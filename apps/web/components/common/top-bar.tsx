import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type BuildPillStatus = "idle" | "running" | "partial" | "failed" | "succeeded";

const PILL_STYLES: Record<BuildPillStatus, string> = {
  idle: "text-[var(--muted-foreground)]",
  running: "text-[var(--accent)]",
  succeeded: "text-[var(--accent)]",
  partial: "text-[var(--color-criticality-medium)]",
  failed: "text-[var(--color-criticality-high)]",
};

const PILL_LABELS: Record<BuildPillStatus, string> = {
  idle: "No builds yet",
  running: "Building",
  succeeded: "Up to date",
  partial: "Built with gaps",
  failed: "Build failed",
};

export function TopBar({
  workspaceId,
  workspaceName,
  buildStatus = "idle",
  userEmail,
}: {
  workspaceId: string;
  workspaceName: string;
  buildStatus?: BuildPillStatus;
  userEmail?: string | null;
}) {
  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-[var(--border)] px-3">
      <Link href="/" className="text-xs font-semibold hover:underline">
        Overnight QA
      </Link>
      <span className="text-[var(--border)]">/</span>
      <span className="truncate text-xs font-medium">{workspaceName}</span>

      <span
        className={cn(
          "rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px]",
          PILL_STYLES[buildStatus],
        )}
      >
        {PILL_LABELS[buildStatus]}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href={`/w/${workspaceId}/settings/sources`}
          className="text-xs text-[var(--muted-foreground)] hover:underline"
        >
          Sources
        </Link>
        <Link
          href={`/w/${workspaceId}/builds`}
          className="text-xs text-[var(--muted-foreground)] hover:underline"
        >
          Builds
        </Link>
        <Link
          href={`/w/${workspaceId}/evals`}
          className="text-xs text-[var(--muted-foreground)] hover:underline"
        >
          Evals
        </Link>
        <span className="hidden text-xs text-[var(--muted-foreground)] sm:inline">
          {userEmail}
        </span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
