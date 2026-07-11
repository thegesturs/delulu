"use client";

import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@delulu/design-system/components/ui/card";
import { Input } from "@delulu/design-system/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  OperationsError,
  OperationsLoading,
} from "@/components/operations/query-state";
import { useApiClient } from "@/components/providers/api-client";
import { useOperationsWorkspace } from "@/hooks/use-operations-workspace";

export function BillingOperations() {
  const { resources } = useApiClient();
  const workspace = useOperationsWorkspace();
  const queryClient = useQueryClient();
  const workspaceId = workspace.workspaceId ?? "";
  const [targetUserId, setTargetUserId] = useState("");
  const transactionOptions = resources.billing.transactions(workspaceId, {
    limit: 10,
    offset: 0,
  });
  const transferOptions = resources.billing.transfers(workspaceId);
  const transactions = useQuery({
    ...transactionOptions,
    queryKey: transactionOptions.queryKey!,
    enabled: !!workspace.workspaceId,
  });
  const transfers = useQuery({
    ...transferOptions,
    queryKey: transferOptions.queryKey!,
    enabled: !!workspace.workspaceId,
  });
  const requestTransfer = useMutation(
    resources.billing.requestTransfer(workspaceId)
  );
  const acceptTransfer = useMutation(
    resources.billing.acceptTransfer(workspaceId)
  );
  const cancelTransfer = useMutation(
    resources.billing.cancelTransfer(workspaceId)
  );

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: transferOptions.queryKey!,
    });
    await queryClient.invalidateQueries({
      queryKey: resources.billing.subscription(workspaceId).queryKey!,
    });
  };

  const mutate = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      await invalidate();
      toast.success(message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Billing action failed"
      );
    }
  };

  const error = workspace.error ?? transactions.error ?? transfers.error;
  if (error) {
    return (
      <OperationsError
        error={error}
        onRetry={async () => {
          if (workspace.error) {
            await workspace.retry();
          } else {
            await Promise.all([transactions.refetch(), transfers.refetch()]);
          }
        }}
      />
    );
  }

  if (workspace.isLoading || transactions.isPending || transfers.isPending) {
    return <OperationsLoading label="Loading billing activity" />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Billing owner transfer</CardTitle>
          <CardDescription>
            Move future pooled usage charges to another workspace member.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              onChange={(event) => setTargetUserId(event.target.value)}
              placeholder="Target user ID"
              value={targetUserId}
            />
            <Button
              disabled={!targetUserId.trim() || requestTransfer.isPending}
              onClick={async () => {
                await mutate(
                  () =>
                    requestTransfer.mutateAsync({
                      toUserId: targetUserId.trim(),
                    }),
                  "Transfer requested"
                );
                setTargetUserId("");
              }}
            >
              Request
            </Button>
          </div>
          {transfers.data?.length ? (
            <div className="space-y-2">
              {transfers.data.map((transfer) => {
                const expired =
                  transfer.status === "pending" &&
                  new Date(transfer.expiresAt).getTime() <= Date.now();
                return (
                  <div className="rounded-lg border p-3" key={transfer.id}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm">
                          {transfer.fromUserId} → {transfer.toUserId}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Expires{" "}
                          {new Date(transfer.expiresAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={expired ? "destructive" : "secondary"}>
                        {expired ? "expired" : transfer.status}
                      </Badge>
                    </div>
                    {!expired && transfer.status === "pending" && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          disabled={acceptTransfer.isPending}
                          onClick={async () => {
                            await mutate(
                              () => acceptTransfer.mutateAsync(transfer.id),
                              "Transfer accepted"
                            );
                          }}
                          size="sm"
                        >
                          Accept
                        </Button>
                        <Button
                          disabled={cancelTransfer.isPending}
                          onClick={async () => {
                            await mutate(
                              () => cancelTransfer.mutateAsync(transfer.id),
                              "Transfer cancelled"
                            );
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No transfer history.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Recent workspace billing activity.</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.data?.data.length ? (
            <div className="divide-y">
              {transactions.data.data.map((transaction) => (
                <div
                  className="flex items-center justify-between py-3"
                  key={transaction.id}
                >
                  <div>
                    <p className="font-medium text-sm">{transaction.status}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="font-mono text-sm">
                    {(transaction.amountMinor / 100).toFixed(2)}{" "}
                    {transaction.currency}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No transactions yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
