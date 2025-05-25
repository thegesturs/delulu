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
  SidebarSeparator,
  useSidebar,
} from '@delulu/design-system/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@delulu/design-system/components/ui/tooltip';
import { cn } from '@delulu/design-system/lib/utils';
import { NotificationsTrigger } from '@delulu/notifications/components/trigger';
import {
  BookOpenIcon,
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

const configurationItems = [
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
      <Sidebar variant="inset" className="dark:bg-sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
          <OrganizationSwitcher />
          <Button asChild className="group-data-[collapsed=true]:hidden">
            <Link href="/">
              <PencilIcon className="h-5 w-5" />
              <span className="ml-2">Create Post</span>
            </Link>
          </Button>
          <Button
            asChild
            size="icon"
            className="group-data-[collapsed=false]:hidden"
          >
            <Link href="/">
              <PencilIcon className="h-5 w-5" />
            </Link>
          </Button>
        </SidebarHeader>

        <SidebarContent className="px-3">
          <TooltipProvider delayDuration={0}>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        asChild
                        size="lg"
                        className={cn(
                          'group rounded-lg px-3 transition-all hover:bg-accent hover:shadow-bevel-accent',
                          pathname === item.url &&
                            'bg-accent text-accent-foreground shadow-bevel-secondary',
                          'group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-2'
                        )}
                      >
                        <Link
                          href={item.url}
                          className="py-3 group-data-[collapsed=true]:py-3"
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
                              'ml-3 text-base group-data-[collapsed=true]:hidden',
                              pathname === item.url && 'font-medium'
                            )}
                          >
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      align="center"
                      sideOffset={10}
                      className="group-data-[collapsed=false]:hidden"
                    >
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              ))}
              <SidebarSeparator />
              {configurationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        asChild
                        className="group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-2"
                      >
                        <Link href={item.url}>
                          <item.icon className="h-5 w-5 group-data-[collapsed=false]:mr-3" />
                          <span className="group-data-[collapsed=true]:hidden">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      align="center"
                      sideOffset={10}
                      className="group-data-[collapsed=false]:hidden"
                    >
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </TooltipProvider>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center justify-between gap-2 group-data-[collapsed=true]:flex-col group-data-[collapsed=true]:items-center group-data-[collapsed=true]:p-2">
              <div className="group-data-[collapsed=true]:mb-2">
                <UserButton
                  showName={sidebar?.state !== 'collapsed'}
                  appearance={{
                    elements: {
                      rootBox:
                        'flex overflow-hidden w-full group-data-[collapsed=true]:justify-center',
                      userButtonOuterIdentifier:
                        'truncate pl-0 group-data-[collapsed=true]:hidden',
                      avatarBox:
                        'group-data-[collapsed=true]:w-8 group-data-[collapsed=true]:h-8',
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
