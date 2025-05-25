'use client';

import { UserButton } from '@delulu/auth/client';
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
  BrainCircuitIcon,
  CalendarIcon,
  HomeIcon,
  ImageIcon,
  LayoutDashboardIcon,
  LineChartIcon,
  LogOutIcon,
  PencilIcon,
  UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type GlobalSidebarProperties = {
  readonly children: ReactNode;
};

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboardIcon,
  },
  {
    title: 'Home',
    url: '/',
    icon: HomeIcon,
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

const personalBrandItems = [
  {
    title: 'Knowledge Base',
    url: '/knowledge',
    icon: BookOpenIcon,
  },
  {
    title: 'Tone of Voice',
    url: '/tone',
    icon: UserIcon,
  },
  {
    title: 'AI Photos',
    url: '/photos',
    icon: ImageIcon,
  },
];

export const GlobalSidebar = ({ children }: GlobalSidebarProperties) => {
  const sidebar = useSidebar();
  const pathname = usePathname();

  return (
    <>
      <Sidebar variant="inset" className="bg-sidebar">
        <SidebarHeader className="px-4 py-6">
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-10 rounded-full shadow-bevel w-10',
                },
              }}
            />
            <div
              className={cn(
                'flex flex-col transition-all',
                sidebar.open ? 'opacity-100' : 'w-0 opacity-0'
              )}
            >
              <span className="font-semibold">Personal Workspace</span>
              <Button variant="ghost" size="sm" className="h-6 px-0" asChild>
                <Link
                  href="/create-post"
                  className="text-sidebar-primary hover:text-sidebar-primary/90"
                >
                  Create posts
                </Link>
              </Button>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarMenu>
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className={cn(
                    'group rounded-lg transition-all hover:bg-sidebar-accent hover:shadow-bevel',
                    pathname === item.url &&
                      'bg-sidebar-accent text-sidebar-primary shadow-bevel'
                  )}
                >
                  <Link href={item.url} className="py-2">
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
                        'ml-3',
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

          <div className="mt-8">
            <h3 className="mb-4 px-4 font-medium text-sidebar-foreground/60 text-xs uppercase">
              Personal Brand
            </h3>
            <SidebarMenu>
              {personalBrandItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      'group rounded-lg transition-all hover:bg-sidebar-accent hover:shadow-bevel',
                      pathname === item.url &&
                        'bg-sidebar-accent text-sidebar-primary shadow-bevel'
                    )}
                  >
                    <Link href={item.url} className="py-2">
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
                          'ml-3',
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
          </div>
        </SidebarContent>

        <SidebarFooter className="px-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="group rounded-lg transition-all hover:bg-sidebar-accent hover:shadow-bevel"
              >
                <button type="button" className="py-2">
                  <LogOutIcon className="h-5 w-5 text-sidebar-foreground" />
                  <span className="ml-3">Logout</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </>
  );
};
