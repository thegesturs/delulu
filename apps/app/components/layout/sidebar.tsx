'use client';
import { UserButton } from '@clerk/nextjs';
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
import {
  BookOpenIcon,
  CalendarIcon,
  LayoutDashboardIcon,
  LineChartIcon,
  PencilIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
// import { OrganizationSwitcher } from './organization-switcher';

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
    title: 'Posts',
    url: '/posts',
    icon: BookOpenIcon,
  },
  {
    title: 'Calendar',
    url: '/calendar',
    icon: CalendarIcon,
  },
  {
    title: 'Connected Accounts',
    url: '/socials',
    icon: LineChartIcon,
  },
];

// const configurationItems = [
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
      <Sidebar
        variant="inset"
        className="group dark:bg-sidebar"
        collapsible="icon"
      >
        <SidebarHeader className="p-4">
          {/* <OrganizationSwitcher /> */}
          <Button
            asChild
            className="flex w-full items-center group-data-[state=collapsed]:hidden"
          >
            <Link href="/post">
              <PencilIcon className="mr-2 h-4 w-4" />
              Create Post
            </Link>
          </Button>
          <Button
            asChild
            size="icon"
            className="w-full group-data-[state=expanded]:hidden"
          >
            <Link href="/post">
              <PencilIcon className="h-5 w-5" />
            </Link>
          </Button>
        </SidebarHeader>

        <SidebarContent className="px-3">
          <SidebarMenu className="group-data-[state=collapsed]:items-center">
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  className={cn(
                    'group rounded-md px-3 transition-all hover:bg-accent hover:shadow-bevel-accent group-data-[state=collapsed]:hover:shadow-none',
                    pathname === item.url &&
                      'bg-accent text-accent-foreground shadow-bevel-secondary group-data-[state=collapsed]:shadow-none',
                    'group-data-[state=collapsed]:justify-center'
                  )}
                  tooltip={{
                    children: item.title,
                    side: 'right',
                    align: 'center',
                    sideOffset: 10,
                  }}
                >
                  <Link
                    href={item.url}
                    className={cn(
                      'py-3',
                      'flex group-data-[state=collapsed]:h-full group-data-[state=collapsed]:w-full group-data-[state=collapsed]:items-center group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:py-0'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-5 w-5',
                        pathname === item.url
                          ? 'text-primary'
                          : 'text-foreground'
                      )}
                    />
                    <span
                      className={cn(
                        'ml-3 text-base',
                        pathname === item.url && 'font-medium',
                        'group-data-[state=collapsed]:hidden'
                      )}
                    >
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {/* <SidebarSeparator />
            {configurationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  className={cn(
                    'group rounded-lg px-3 transition-all hover:bg-accent hover:shadow-bevel-accent',
                    pathname === item.url &&
                      'bg-accent text-accent-foreground shadow-bevel-secondary',
                    'group-data-[state=collapsed]:justify-center'
                  )}
                  tooltip={{
                    children: item.title,
                    side: 'right',
                    align: 'center',
                    sideOffset: 10,
                  }}
                >
                  <Link
                    href={item.url}
                    className={cn(
                      'py-3',
                      'flex group-data-[state=collapsed]:h-full group-data-[state=collapsed]:w-full group-data-[state=collapsed]:items-center group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:py-0'
                    )}
                  >
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
                        pathname === item.url && 'font-medium',
                        'group-data-[state=collapsed]:hidden'
                      )}
                    >
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))} */}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu className="group-data-[state=collapsed]:items-center">
            <SidebarMenuItem className="flex items-center justify-between gap-2 group-data-[state=collapsed]:flex-col group-data-[state=collapsed]:items-center group-data-[state=collapsed]:p-2">
              <div className="group-data-[state=collapsed]:mb-2">
                <UserButton
                  showName={sidebar?.state !== 'collapsed'}
                  appearance={{
                    elements: {
                      rootBox:
                        'flex overflow-hidden w-full group-data-[state=collapsed]:justify-center',
                      userButtonOuterIdentifier:
                        'truncate pl-0 group-data-[state=collapsed]:hidden',
                      avatarBox:
                        'group-data-[state=collapsed]:w-8 group-data-[state=collapsed]:h-8',
                    },
                  }}
                />
              </div>
              <div className="flex shrink-0 items-center gap-px">
                <ModeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  asChild
                >
                  {/* <div className="h-4 w-4">
                    <NotificationsTrigger />
                  </div> */}
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
