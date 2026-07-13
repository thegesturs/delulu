import { PageShell } from "@/components/layout/page-shell";
import { WorkspaceMembers } from "@/components/operations/workspace-members";
import { WorkspaceSettings } from "@/components/operations/workspace-settings";

export default function WorkspacePage() {
  return (
    <PageShell
      description="Manage your workspace details and team members."
      page="Workspace"
      pages={["Settings"]}
    >
      <WorkspaceSettings />
      {/* WorkspaceMembers renders null on personal workspaces, so it manages
          its own section chrome rather than a PageSection that could dangle. */}
      <WorkspaceMembers />
    </PageShell>
  );
}
