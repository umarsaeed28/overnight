import { ViewerNoKnowledge } from "@/components/viewer/viewer";
import { apiFetch } from "@/lib/api";
import { roleSatisfies, type api } from "@oqa/core";
import type { z } from "zod";

type WorkspaceDetail = z.infer<typeof api.workspaceDetailResponse>;

/**
 * The viewer's default is `overview.md` (section 20.1). Until a build has
 * produced one, it explains what is missing and what to do next.
 */
export default async function WorkspaceViewerPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const detail = await apiFetch<WorkspaceDetail>(`/workspaces/${workspaceId}`);

  return (
    <ViewerNoKnowledge
      workspaceId={workspaceId}
      canConnectSources={roleSatisfies(detail.workspace.role, "owner")}
    />
  );
}
