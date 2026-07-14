"use client";

import { useAuth } from "@delulu/auth";
import { Button } from "@delulu/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@delulu/design-system/components/ui/card";
import { Input } from "@delulu/design-system/components/ui/input";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8788"
    : "https://api.delulu.social");

function DeviceApprovalForm() {
  const params = useSearchParams();
  const { getToken } = useAuth();
  const [userCode, setUserCode] = useState(params.get("user_code") ?? "");
  const [status, setStatus] = useState<
    "idle" | "working" | "approved" | "denied"
  >("idle");
  const [error, setError] = useState<string>();
  const [details, setDetails] = useState<{
    clientId: string;
    clientName: string;
    scopes: string[];
    resource: string | null;
  }>();

  useEffect(() => {
    if (!userCode) {
      return;
    }
    let active = true;
    getToken()
      .then(async (token) => {
        if (!token) {
          return;
        }
        const response = await fetch(
          `${apiBaseUrl}/oauth/device/transaction?user_code=${encodeURIComponent(userCode)}`,
          { headers: { authorization: `Bearer ${token}` } }
        );
        if (active && response.ok) {
          setDetails(await response.json());
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [getToken, userCode]);

  const decide = async (decision: "approve" | "deny") => {
    setStatus("working");
    setError(undefined);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Your sign-in session is unavailable");
      }
      const response = await fetch(`${apiBaseUrl}/oauth/device/${decision}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ user_code: userCode }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error_description?: string;
        } | null;
        throw new Error(body?.error_description ?? "Authorization failed");
      }
      setStatus(decision === "approve" ? "approved" : "denied");
    } catch (cause) {
      setStatus("idle");
      setError(cause instanceof Error ? cause.message : "Authorization failed");
    }
  };

  if (status === "approved" || status === "denied") {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>
              {status === "approved" ? "Agent authorized" : "Access denied"}
            </CardTitle>
            <CardDescription>
              {status === "approved"
                ? "Return to your agent. It can continue setup now."
                : "No credentials were issued. You can close this tab."}
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Authorize agent access</CardTitle>
          <CardDescription>
            The agent will receive scoped access to manage setup, connected
            accounts, media, and posts. Workspace membership and role rules
            continue to apply.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="font-medium text-sm" htmlFor="user-code">
            Verification code
          </label>
          <Input
            autoComplete="one-time-code"
            id="user-code"
            onChange={(event) => setUserCode(event.target.value.toUpperCase())}
            placeholder="ABCD-EFGH"
            value={userCode}
          />
          {details && (
            <div className="space-y-2 rounded-md border p-3 text-sm">
              <p>
                <strong>Client:</strong> {details.clientName} (
                {details.clientId})
              </p>
              <p>
                <strong>Resource:</strong> {details.resource ?? "Default API"}
              </p>
              <p>
                <strong>Scopes:</strong> {details.scopes.join(", ")}
              </p>
            </div>
          )}
          {error && <p className="text-destructive text-sm">{error}</p>}
        </CardContent>
        <CardFooter className="justify-end gap-3">
          <Button
            disabled={status === "working" || !userCode.trim() || !details}
            onClick={() => decide("deny")}
            variant="outline"
          >
            Deny
          </Button>
          <Button
            disabled={status === "working" || !userCode.trim() || !details}
            onClick={() => decide("approve")}
          >
            {status === "working" ? "Authorizing…" : "Authorize"}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

export default function DeviceApprovalPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-6">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Authorize agent access</CardTitle>
              <CardDescription>Loading verification request…</CardDescription>
            </CardHeader>
          </Card>
        </main>
      }
    >
      <DeviceApprovalForm />
    </Suspense>
  );
}
