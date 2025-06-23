import { StoreProvider } from '@/providers/store-provider';
import { auth } from '@delulu/auth/server';
import { SidebarProvider } from '@delulu/design-system/components/ui/sidebar';
import { NotificationsProvider } from '@delulu/notifications/components/provider';
import { secure } from '@delulu/security';
import { PostHogIdentifier } from 'components/layout/posthog-identifier';
import { GlobalSidebar } from 'components/layout/sidebar';
import { env } from 'env';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

type AppLayoutProperties = {
  readonly children: ReactNode;
};

const AppLayout = async ({ children }: AppLayoutProperties) => {
  if (env.ARCJET_KEY) {
    await secure(['CATEGORY:PREVIEW']);
  }

  // Get session using Better Auth recommended approach for server components
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  const user = session.user;

  return (
    <NotificationsProvider userId={user.id}>
      <SidebarProvider>
        <GlobalSidebar>
          <StoreProvider>{children}</StoreProvider>
        </GlobalSidebar>
        <PostHogIdentifier />
      </SidebarProvider>
    </NotificationsProvider>
  );
};

export default AppLayout;
