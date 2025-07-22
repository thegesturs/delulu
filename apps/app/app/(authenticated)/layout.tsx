import ConvexAuthProvider from '@/components/providers/auth-provider';
import { StoreProvider } from '@/providers/store-provider';
import { SidebarProvider } from '@delulu/design-system/components/ui/sidebar';
import { secure } from '@delulu/security';
import { PostHogIdentifier } from 'components/layout/posthog-identifier';
import { GlobalSidebar } from 'components/layout/sidebar';
import { env } from 'env';
import type { ReactNode } from 'react';

type AppLayoutProperties = {
  readonly children: ReactNode;
};

const AppLayout = async ({ children }: AppLayoutProperties) => {
  if (env.ARCJET_KEY) {
    await secure(['CATEGORY:PREVIEW']);
  }

  return (
    <>
      <ConvexAuthProvider>
        <SidebarProvider>
          <GlobalSidebar>
            <StoreProvider>{children}</StoreProvider>
          </GlobalSidebar>
          <PostHogIdentifier />
        </SidebarProvider>
      </ConvexAuthProvider>
    </>
  );
};

export default AppLayout;
