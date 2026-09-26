import { auth } from "@/auth";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ThreePaneShell } from "@/components/common/three-pane-shell";
import { TopBar } from "@/components/common/top-bar";
import { Explorer } from "@/components/explorer/explorer";
import { apiFetch, ApiError } from "@/lib/api";
import { roleSatisfies, type api } from "@oqa/core";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { z } from "zod";

type WorkspaceDetail = z.infer<typeof api.workspaceDetailResponse>;

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { workspaceId } = await params;

  let detail: WorkspaceDetail;
  try {
    detail = await apiFetch<WorkspaceDetail>(`/workspaces/${workspaceId}`);
  } catch (error) {
    // The API answers 404 for a workspace the user cannot see, so the UI shows
    // the same thing it would for one that does not exist (section 23).
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const canConnectSources = roleSatisfies(detail.workspace.role, "owner");
  const sourceCount = detail.sources.length;

  return (
    <div className="flex h-dvh flex-col">
      <TopBar
        workspaceId={workspaceId}
        workspaceName={detail.workspace.name}
        userEmail={session.user.email}
      />
      <ThreePaneShell
        explorer={
          <Explorer
            workspaceId={workspaceId}
            counts={{ knowledge: 0, sources: sourceCount, coverage: 0, tests: 0 }}
            canConnectSources={canConnectSources}
          />
        }
        viewer={children}
        chat={<ChatPanel hasKnowledge={false} />}
      />
    </div>
  );
}
