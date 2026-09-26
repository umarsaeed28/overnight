import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

/**
 * Every data view owes the user three explicit states (section 20.10). Keeping
 * them in one place is what makes "explicit" enforceable rather than aspirational.
 */

export function LoadingState({ rows = 5, label }: { rows?: number; label?: string }) {
  return (
    <div className="space-y-2 p-3" role="status" aria-busy="true" aria-label={label ?? "Loading"}>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className={index % 3 === 2 ? "h-4 w-2/3" : "h-4 w-full"} />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  /** What is missing and why, in a plain sentence. */
  description: string;
  /** The single next action that resolves the emptiness. */
  action?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-sm text-xs text-[var(--muted-foreground)]">{description}</p>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "That did not load",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="text-sm font-medium text-[var(--color-criticality-high)]">{title}</p>
      {/* Plain sentence with a next action; never a stack trace (section 25). */}
      <p className="max-w-sm text-xs text-[var(--muted-foreground)]">{message}</p>
      {onRetry ? (
        <Button size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
