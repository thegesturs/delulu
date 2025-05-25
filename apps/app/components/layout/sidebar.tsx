'use client';
import { UserButton } from '@delulu/auth/client';
import { ModeToggle } from '@delulu/design-system/components/mode-toggle';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@delulu/design-system/components/ui/sidebar';
import { cn } from '@delulu/design-system/lib/utils';
import { NotificationsTrigger } from '@delulu/notifications/components/trigger';
import {
  BookOpenIcon,
  BrainCircuitIcon,
  CalendarIcon,
  ImageIcon,
  LayoutDashboardIcon,
  LineChartIcon,
  PencilIcon,
  UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { OrganizationSwitcher } from './organization-switcher';

type GlobalSidebarProperties = {
  readonly children: ReactNode;
};

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboardIcon,
  },
  {
    title: 'Sources',
    url: '/sources',
    icon: PencilIcon,
  },
  {
    title: 'Posts',
    url: '/posts',
    icon: BookOpenIcon,
  },
  {
    title: 'Inspiration',
    url: '/inspiration',
    icon: BrainCircuitIcon,
  },
  {
    title: 'Calendar',
    url: '/calendar',
    icon: CalendarIcon,
  },
  {
    title: 'Analytics',
    url: '/analytics',
    icon: LineChartIcon,
  },
];

// const personalBrandItems = [
//   {
//     title: 'Knowledge Base',
//     url: '/knowledge',
//     icon: BookOpenIcon,
//   },
//   {
//     title: 'Tone of Voice',
//     url: '/tone',
//     icon: UserIcon,
//   },
//   {
//     title: 'AI Photos',
//     url: '/photos',
//     icon: ImageIcon,
//   },
// ];

export const GlobalSidebar = ({ children }: GlobalSidebarProperties) => {
  const sidebar = useSidebar();
  const pathname = usePathname();

  return (
    <>
      <Sidebar variant="inset" className="dark:bg-sidebar">
        <SidebarHeader className="p-4">
          <OrganizationSwitcher />
          <Button asChild>
            <Link href="/">Create Post</Link>
          </Button>
        </SidebarHeader>

        <SidebarContent className="px-3">
          <SidebarMenu>
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  className={cn(
                    'group rounded-lg px-3 transition-all hover:bg-accent hover:shadow-bevel-accent',
                    pathname === item.url &&
                      'bg-accent text-accent-foreground shadow-bevel-secondary'
                  )}
                >
                  <Link href={item.url} className="py-3">
                    <item.icon
                      className={cn(
                        'h-5 w-5',
                        pathname === item.url
                          ? 'text-sidebar-primary'
                          : 'text-sidebar-foreground'
                      )}
                    />
                    <span
                      className={cn(
                        'ml-3 text-base',
                        pathname === item.url && 'font-medium'
                      )}
                    >
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center justify-between gap-2">
              <UserButton
                showName
                appearance={{
                  elements: {
                    rootBox: 'flex overflow-hidden w-full',
                    userButtonOuterIdentifier: 'truncate pl-0',
                  },
                }}
              />
              <div className="flex shrink-0 items-center gap-px">
                <ModeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  asChild
                >
                  <div className="h-4 w-4">
                    <NotificationsTrigger />
                  </div>
                </Button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="dark:border">{children}</SidebarInset>
    </>
  );
};
