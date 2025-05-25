'use client';
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
      <Sidebar variant="inset">
        <SidebarHeader className="p-4">
          <OrganizationSwitcher />
        </SidebarHeader>

        <SidebarContent className="px-3">
          <SidebarMenu>
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  className={cn(
                    'group rounded-lg px-3 transition-all hover:bg-sidebar-accent hover:shadow-bevel',
                    pathname === item.url &&
                      'bg-sidebar-accent text-sidebar-primary shadow-bevel'
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

          {/* <div className="mt-8">
            <h3 className="mb-4 px-4 font-medium text-sidebar-foreground/60 text-sm uppercase">
              Personal Brand
            </h3>
            <SidebarMenu>
              {personalBrandItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    className={cn(
                      'group rounded-lg transition-all hover:bg-sidebar-accent hover:shadow-bevel',
                      pathname === item.url &&
                        'bg-sidebar-accent text-sidebar-primary shadow-bevel'
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
          </div> */}
        </SidebarContent>

        <SidebarFooter className="px-3 pb-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="lg"
                className="group rounded-lg transition-all hover:bg-sidebar-accent hover:shadow-bevel"
              >
                <button type="button" className="py-3">
                  <LogOutIcon className="h-5 w-5 text-sidebar-foreground" />
                  <span className="ml-3 text-base">Logout</span>
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
