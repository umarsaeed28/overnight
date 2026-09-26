"use client";

import { EmptyState } from "@/components/common/states";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRef, useState } from "react";

/** Section 20.3. Counts come from the tree endpoint once a build exists. */
export type ExplorerTab = "knowledge" | "sources" | "coverage" | "tests";

const TABS: { id: ExplorerTab; label: string }[] = [
  { id: "knowledge", label: "Knowledge" },
  { id: "sources", label: "Sources" },
  { id: "coverage", label: "Coverage" },
  { id: "tests", label: "Tests" },
];

export interface ExplorerCounts {
  knowledge: number;
  sources: number;
  coverage: number;
  tests: number;
}

export function Explorer({
  workspaceId,
  counts,
  canConnectSources,
}: {
  workspaceId: string;
  counts: ExplorerCounts;
  canConnectSources: boolean;
}) {
  const [tab, setTab] = useState<ExplorerTab>("knowledge");
  const [filter, setFilter] = useState("");
  const filterRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="flex h-full flex-col"
      onKeyDown={(event) => {
        // `/` focuses the filter (section 20.3).
        if (event.key === "/" && event.target !== filterRef.current) {
          event.preventDefault();
          filterRef.current?.focus();
        }
      }}
    >
      <div role="tablist" className="flex shrink-0 border-b border-[var(--border)]">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 px-2 py-2 text-[11px] font-medium",
              tab === id ? "border-b-2 border-[var(--accent)]" : "text-[var(--muted-foreground)]",
            )}
          >
            {label}
            {counts[id] > 0 ? (
              <span className="ml-1 text-[var(--muted-foreground)]">{counts[id]}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="shrink-0 border-b border-[var(--border)] p-2">
        <Input
          ref={filterRef}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter (/)"
          className="h-7 text-xs"
          aria-label="Filter the tree"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ExplorerBody tab={tab} workspaceId={workspaceId} canConnectSources={canConnectSources} />
      </div>
    </div>
  );
}

function ExplorerBody({
  tab,
  workspaceId,
  canConnectSources,
}: {
  tab: ExplorerTab;
  workspaceId: string;
  canConnectSources: boolean;
}) {
  const connectAction = canConnectSources ? (
    <Link
      href={`/w/${workspaceId}/settings/sources`}
      className="text-xs text-[var(--accent)] hover:underline"
    >
      Connect a source
    </Link>
  ) : (
    <span className="text-xs text-[var(--muted-foreground)]">
      Ask a workspace owner to connect a source.
    </span>
  );

  switch (tab) {
    case "knowledge":
      return (
        <EmptyState
          title="No knowledge yet"
          description="Knowledge files are built from your code, docs and tickets. Connect a source and run a build."
          action={connectAction}
        />
      );
    case "sources":
      return (
        <EmptyState
          title="No sources connected"
          description="Connect GitHub, Azure DevOps, Confluence or Jira with read-only access."
          action={connectAction}
        />
      );
    case "coverage":
      return (
        <EmptyState
          title="No coverage yet"
          description="Coverage compares your existing tests against the flows found in the application."
          action={connectAction}
        />
      );
    case "tests":
      return (
        <EmptyState
          title="No test cases yet"
          description="Generated test cases appear here once flows exist to generate them from."
          action={connectAction}
        />
      );
  }
}
