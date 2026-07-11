"use client";
import {
  SOCIAL_ACCOUNT_CONNECTED,
  SOCIAL_ACCOUNT_CONNECTION_FAILED,
} from "@delulu/analytics/events";
import { useAnalytics } from "@delulu/analytics/posthog/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@delulu/design-system/components/ui/avatar";
import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@delulu/design-system/components/ui/dialog";
import { Input } from "@delulu/design-system/components/ui/input";
import { ScrollArea } from "@delulu/design-system/components/ui/scroll-area";
import { Icon } from "@delulu/design-system/providers/icon";
import type { FacebookPagePublic } from "@delulu/validators/facebook";
import { Search01Icon } from "@hugeicons-pro/core-solid-rounded";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaFacebookF } from "react-icons/fa6";
import { toast } from "sonner";

interface FacebookPageSelectProps {
  pages: FacebookPagePublic[];
  code: string;
}

function formatNumber(num?: number): string {
  if (!num) {
    return "0";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function FacebookPageSelect({
  pages,
  code: _code,
}: FacebookPageSelectProps) {
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();
  const analytics = useAnalytics();

  const isPending = false;

  const handleCancel = () => {
    setIsCancelling(true);
    router.push("/socials?error=user_cancelled&provider=facebook");
  };

  const handleConfirm = () => {
    const selectedPage = pages.find((page) => page.id === selectedPageId);
    if (!selectedPage) {
      toast.error("No page selected");
      return;
    }

    analytics.capture(SOCIAL_ACCOUNT_CONNECTION_FAILED, {
      provider: "facebook",
      error_type: "page_selection_not_supported",
    });
    toast.error(
      "Facebook page selection is not available in this milestone. Reconnect from Connected Accounts when page selection support is enabled."
    );
  };

  const filteredPages = pages.filter(
    (page) =>
      page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
              <FaFacebookF className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Select Facebook Page
              </DialogTitle>
              <DialogDescription className="mt-1">
                Choose the Facebook page you want to connect to your account
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="relative mt-4">
          <Icon
            className="absolute top-1/2 left-3 -translate-y-1/2 transform text-muted-foreground"
            icon={Search01Icon}
            size={16}
          />
          <Input
            className="pl-9"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pages..."
            value={searchQuery}
          />
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {filteredPages.map((page) => (
              <button
                className={`w-full rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
                  selectedPageId === page.id
                    ? "border-primary bg-accent"
                    : "border-border"
                }`}
                key={page.id}
                onClick={() => setSelectedPageId(page.id)}
                type="button"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage alt={page.name} src={page.picture?.data.url} />
                    <AvatarFallback>
                      {page.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-medium">{page.name}</h3>
                      {page.verification_status === "verified" && (
                        <Badge className="bg-blue-600" variant="default">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-muted-foreground text-sm">
                      {page.category}
                    </p>
                    <div className="mt-1 flex items-center gap-4 text-muted-foreground text-xs">
                      <span>
                        {formatNumber(page.followers_count)} followers
                      </span>
                      <span>{formatNumber(page.fan_count)} likes</span>
                    </div>
                  </div>
                  {selectedPageId === page.id && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                      <svg
                        className="h-4 w-4 text-primary-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-6 flex items-center justify-between sm:justify-between">
          <Button
            disabled={isCancelling}
            onClick={handleCancel}
            variant="outline"
          >
            {isCancelling ? "Cancelling..." : "Cancel"}
          </Button>
          <Button
            className="min-w-[100px]"
            disabled={!selectedPageId || isPending}
            onClick={handleConfirm}
          >
            {isPending ? "Connecting..." : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
