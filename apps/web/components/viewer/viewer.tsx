import { EmptyState } from "@/components/common/states";
import Link from "next/link";
import type { ReactNode } from "react";

export function ViewerFrame({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-[var(--border)] px-3">
        <span className="truncate text-xs font-medium">{title}</span>
        {subtitle ? (
          <span className="truncate text-[11px] text-[var(--muted-foreground)]">{subtitle}</span>
        ) : null}
        {actions ? <div className="ml-auto flex items-center gap-1">{actions}</div> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

/** What the viewer shows before the first build produces `overview.md`. */
export function ViewerNoKnowledge({
  workspaceId,
  canConnectSources,
}: {
  workspaceId: string;
  canConnectSources: boolean;
}) {
  return (
    <ViewerFrame title="overview.md" subtitle="not built yet">
      <EmptyState
        title="Nothing to read yet"
        description="Once a source is connected and a build has run, this pane shows the application overview, with every claim citing the source it came from."
        action={
          canConnectSources ? (
            <Link
              href={`/w/${workspaceId}/settings/sources`}
              className="text-xs text-[var(--accent)] hover:underline"
            >
              Connect a source
            </Link>
          ) : undefined
        }
      />
    </ViewerFrame>
  );
}
