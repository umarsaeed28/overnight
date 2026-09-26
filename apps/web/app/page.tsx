import { auth } from "@/auth";
import { CreateWorkspaceForm } from "@/components/common/create-workspace-form";
import { EmptyState, ErrorState } from "@/components/common/states";
import { apiFetch, ApiError } from "@/lib/api";
import type { api } from "@oqa/core";
import type { z } from "zod";
import Link from "next/link";
import { redirect } from "next/navigation";

type WorkspaceList = z.infer<typeof api.listWorkspacesResponse>;

export default async function WorkspacesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let data: WorkspaceList | undefined;
  let error: string | undefined;
  try {
    data = await apiFetch<WorkspaceList>("/workspaces");
  } catch (caught) {
    error = caught instanceof ApiError ? caught.message : "Could not reach the API.";
  }

  return (
    <main className="mx-auto flex h-dvh max-w-2xl flex-col gap-6 overflow-y-auto p-8">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold">Workspaces</h1>
        <p className="text-xs text-[var(--muted-foreground)]">
          One workspace per application under test. Signed in as {session.user.email}.
        </p>
      </header>

      {error ? (
        <ErrorState message={error} />
      ) : data && data.workspaces.length > 0 ? (
        <ul className="divide-y divide-[var(--border)] rounded-md border border-[var(--border)]">
          {data.workspaces.map((workspace) => (
            <li key={workspace.id}>
              <Link
                href={`/w/${workspace.id}`}
                className="flex items-baseline justify-between gap-3 p-3 hover:bg-[var(--muted)]"
              >
                <span className="text-sm font-medium">{workspace.name}</span>
                <span className="text-xs text-[var(--muted-foreground)]">{workspace.role}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No workspaces yet"
          description="A workspace holds one application: its code, docs and tickets. Create one to get started."
        />
      )}

      <CreateWorkspaceForm />
    </main>
  );
}
