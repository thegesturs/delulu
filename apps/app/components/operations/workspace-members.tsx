"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@delulu/design-system/components/ui/card";
import { Input } from "@delulu/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@delulu/design-system/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useApiClient } from "@/components/providers/api-client";
import { useOperationsWorkspace } from "@/hooks/use-operations-workspace";
import { OperationsError } from "./query-state";

const roles = ["owner", "admin", "editor", "viewer"] as const;
type Role = (typeof roles)[number];

export function WorkspaceMembers() {
  const { resources } = useApiClient();
  const workspace = useOperationsWorkspace();
  const queryClient = useQueryClient();
  const workspaceId = workspace.workspaceId ?? "";
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const options = resources.admin.members(workspaceId, {
    limit: 100,
    offset: 0,
  });
  const query = useQuery({
    ...options,
    queryKey: options.queryKey!,
    enabled: !!workspace.workspaceId,
  });
  const invite = useMutation(resources.admin.inviteMember(workspaceId));
  const remove = useMutation(resources.admin.removeMember(workspaceId));

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: options.queryKey! });
  const updateRole = async (memberId: string, nextRole: Role) => {
    try {
      await resources.admin.updateMember(workspaceId, memberId).mutationFn!({
        role: nextRole,
      });
      await refresh();
      toast.success("Member role updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Role update failed"
      );
    }
  };

  if (workspace.workspace?.isPersonal) {
    return null;
  }

  if (workspace.error) {
    return (
      <OperationsError error={workspace.error} onRetry={workspace.retry} />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace members</CardTitle>
        <CardDescription>
          Invite members and control their access level.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            onChange={(event) => setEmail(event.target.value)}
            placeholder="member@example.com"
            value={email}
          />
          <Select
            onValueChange={(value) => setRole(value as Role)}
            value={role}
          >
            <SelectTrigger className="sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles
                .filter((value) => value !== "owner")
                .map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button
            disabled={!email.trim() || invite.isPending}
            onClick={async () => {
              try {
                await invite.mutateAsync({ email: email.trim(), role });
                await refresh();
                setEmail("");
                toast.success("Invitation sent");
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : "Invitation failed"
                );
              }
            }}
          >
            Invite
          </Button>
        </div>
        {query.isPending ? (
          <p className="text-muted-foreground text-sm">Loading members…</p>
        ) : query.error ? (
          <Button
            onClick={async () => {
              await query.refetch();
            }}
            size="sm"
            variant="outline"
          >
            Retry members
          </Button>
        ) : query.data?.data.length ? (
          <div className="divide-y rounded-lg border">
            {query.data.data.map((member) => (
              <div className="flex items-center gap-3 p-3" key={member.id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">
                    {member.name || member.email || member.userId}
                  </p>
                  <p className="truncate text-muted-foreground text-xs">
                    {member.email}
                  </p>
                </div>
                <Select
                  onValueChange={async (value) => {
                    await updateRole(member.id, value as Role);
                  }}
                  value={member.role}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  disabled={member.role === "owner" || remove.isPending}
                  onClick={async () => {
                    try {
                      await remove.mutateAsync(member.id);
                      await refresh();
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Member removal failed"
                      );
                    }
                  }}
                  size="sm"
                  variant="ghost"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No workspace members.</p>
        )}
      </CardContent>
    </Card>
  );
}
