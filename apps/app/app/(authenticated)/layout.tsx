import { SidebarProvider } from "@delulu/design-system/components/ui/sidebar";
import { secure } from "@delulu/security";
import { PostHogIdentifier } from "components/layout/posthog-identifier";
import { GlobalSidebar } from "components/layout/sidebar";
import { UserJotIdentifier } from "components/layout/userjot-identifier";
import { env } from "env";
import type { ReactNode } from "react";
import { PaidSubscriptionGate } from "@/components/billing/paid-subscription-gate";
import { MobileBottomTabs } from "@/components/layout/mobile-bottom-tabs";
import { FeatureTour } from "@/components/onboarding/feature-tour";
import { BackendProviders } from "@/components/providers/backend";
import { StoreProvider } from "@/providers/store-provider";

interface AppLayoutProperties {
  readonly children: ReactNode;
}

export const dynamic = "force-dynamic";

const AppLayout = async ({ children }: AppLayoutProperties) => {
  if (env.ARCJET_KEY) {
    await secure(["CATEGORY:PREVIEW"]);
  }

  return (
    <BackendProviders>
      <SidebarProvider>
        <GlobalSidebar>
          <StoreProvider>{children}</StoreProvider>
        </GlobalSidebar>
        <PaidSubscriptionGate />
        <PostHogIdentifier />
        <UserJotIdentifier />
        <FeatureTour />
        <MobileBottomTabs />
      </SidebarProvider>
    </BackendProviders>
  );
};

export default AppLayout;
