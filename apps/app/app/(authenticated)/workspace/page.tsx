import { Header } from "@/components/layout/header";
import { WorkspaceMembers } from "@/components/operations/workspace-members";
import { WorkspaceSettings } from "@/components/operations/workspace-settings";

export default function WorkspacePage() {
  return (
    <div className="space-y-4 overflow-auto p-4 md:p-8">
      <Header page="Workspace" pages={["Settings"]} />
      <WorkspaceSettings />
      <WorkspaceMembers />
    </div>
  );
}
