import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api";
import type { api } from "@oqa/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";

type Workspace = z.infer<typeof api.workspaceSchema>;

export function CreateWorkspaceForm() {
  async function create(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;

    let workspace: Workspace;
    try {
      workspace = await apiFetch<Workspace>("/workspaces", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Could not create the workspace. Try again.", { cause: error });
    }

    revalidatePath("/");
    redirect(`/w/${workspace.id}`);
  }

  return (
    <form action={create} className="flex items-end gap-2 border-t border-[var(--border)] pt-4">
      <div className="flex-1 space-y-1">
        <label className="block text-xs font-medium" htmlFor="workspace-name">
          New workspace
        </label>
        <Input id="workspace-name" name="name" required placeholder="ShopDemo" maxLength={120} />
      </div>
      <Button type="submit" variant="primary">
        Create
      </Button>
    </form>
  );
}
