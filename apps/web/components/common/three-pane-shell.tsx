"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, type ReactNode } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

/** Section 20.2. Sizes are percentages and persist per user. */
const DEFAULT_SIZES = { explorer: 22, viewer: 48, chat: 30 };
const NARROW_BREAKPOINT = 1024;

type PaneId = "explorer" | "viewer" | "chat";

const TAB_LABELS: Record<PaneId, string> = {
  explorer: "Explore",
  viewer: "Read",
  chat: "Ask",
};

function useIsNarrow(): boolean {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${NARROW_BREAKPOINT - 1}px)`);
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return narrow;
}

export function ThreePaneShell({
  explorer,
  viewer,
  chat,
}: Record<PaneId, ReactNode>) {
  const narrow = useIsNarrow();
  const [activeTab, setActiveTab] = useState<PaneId>("viewer");

  // Under 1024px the three panes become tabs: 22% of a phone screen is not a
  // usable tree (section 20.2).
  if (narrow) {
    const panes: Record<PaneId, ReactNode> = { explorer, viewer, chat };
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div role="tablist" className="flex border-b border-[var(--border)]">
          {(Object.keys(TAB_LABELS) as PaneId[]).map((pane) => (
            <button
              key={pane}
              role="tab"
              aria-selected={activeTab === pane}
              onClick={() => setActiveTab(pane)}
              className={cn(
                "flex-1 px-3 py-2 text-xs font-medium",
                activeTab === pane
                  ? "border-b-2 border-[var(--accent)]"
                  : "text-[var(--muted-foreground)]",
              )}
            >
              {TAB_LABELS[pane]}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{panes[activeTab]}</div>
      </div>
    );
  }

  return (
    <PanelGroup
      direction="horizontal"
      // react-resizable-panels persists layout to localStorage under this id.
      autoSaveId="oqa:panes"
      className="min-h-0 flex-1"
    >
      <Panel defaultSize={DEFAULT_SIZES.explorer} minSize={12} collapsible order={1}>
        <div className="h-full overflow-hidden">{explorer}</div>
      </Panel>
      <PanelResizeHandle aria-label="Resize explorer" />
      <Panel defaultSize={DEFAULT_SIZES.viewer} minSize={25} order={2}>
        <div className="h-full overflow-hidden">{viewer}</div>
      </Panel>
      <PanelResizeHandle aria-label="Resize chat" />
      <Panel defaultSize={DEFAULT_SIZES.chat} minSize={15} collapsible order={3}>
        <div className="h-full overflow-hidden">{chat}</div>
      </Panel>
    </PanelGroup>
  );
}
