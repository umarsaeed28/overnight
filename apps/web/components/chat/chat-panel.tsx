import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";

/**
 * M1 renders the frame and the disabled composer. The agent loop, streaming and
 * citations arrive in M4; until then the pane says why it cannot answer rather
 * than accepting a question it would have to guess at.
 */
export function ChatPanel({ hasKnowledge }: { hasKnowledge: boolean }) {
  return (
    <div className="flex h-full flex-col border-l border-[var(--border)]">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-[var(--border)] px-3">
        <span className="text-xs font-medium">Ask</span>
        <Button size="sm" variant="ghost" className="ml-auto" disabled>
          New chat
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <EmptyState
          title={hasKnowledge ? "Ask about this application" : "Nothing to ask about yet"}
          description={
            hasKnowledge
              ? "Questions are answered from your sources only, with citations. If the answer is not in the sources, the agent says so."
              : "The agent answers from your connected sources. Connect a source and run a build first."
          }
        />
      </div>

      <div className="shrink-0 border-t border-[var(--border)] p-2">
        <textarea
          rows={2}
          disabled
          placeholder="Ask a question about this application"
          className="w-full resize-none rounded-md border border-[var(--border)] bg-[var(--muted)] px-2.5 py-2 text-xs disabled:opacity-60"
        />
      </div>
    </div>
  );
}
