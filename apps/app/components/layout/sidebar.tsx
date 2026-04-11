"use client";
import { UserButton } from "@delulu/auth";
import { Logo, LogoIcon } from "@delulu/design-system/components/logo";
import { ModeToggle } from "@delulu/design-system/components/mode-toggle";
import { Button } from "@delulu/design-system/components/ui/button";
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
} from "@delulu/design-system/components/ui/sidebar";
import { CreditCard, Pencil } from "@delulu/design-system/icons";
import { cn } from "@delulu/design-system/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { navigationItems } from "@/lib/navigation";

import { OrganizationSwitcher } from "./organization-switcher";

// Custom hook to detect screens below lg breakpoint (1024px)
const useIsSmallScreen = () => {
  const [isSmallScreen, setIsSmallScreen] = useState<boolean | undefined>(
    undefined
  );

  useEffect(() => {
    const LG_BREAKPOINT = 1300;
    const mql = window.matchMedia(`(max-width: ${LG_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsSmallScreen(window.innerWidth < LG_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsSmallScreen(window.innerWidth < LG_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isSmallScreen;
};

interface GlobalSidebarProperties {
  readonly children: ReactNode;
}

export const GlobalSidebar = ({ children }: GlobalSidebarProperties) => {
  const sidebar = useSidebar();
  const pathname = usePathname();
  const isSmallScreen = useIsSmallScreen();
  const affiliatesEnabled = useFeatureFlag("affiliates");
  const analyticsEnabled = useFeatureFlag("analytics");
  const visibleNavItems = useMemo(
    () =>
      navigationItems.filter((item) => {
        if (!item.flag) {
          return true;
        }
        if (item.flag === "affiliates") {
          return affiliatesEnabled;
        }
        if (item.flag === "analytics") {
          return analyticsEnabled;
        }
        return false;
      }),
    [affiliatesEnabled, analyticsEnabled]
  );

  // Auto-collapse sidebar when screen size goes below lg breakpoint (1024px)
  useEffect(() => {
    if (isSmallScreen && sidebar?.open) {
      sidebar?.setOpen(false);
    }
  }, [isSmallScreen, sidebar]);

  return (
    <>
      <Sidebar
        className="group dark:bg-sidebar"
        collapsible="icon"
        variant="inset"
      >
        <SidebarHeader className="p-4">
          <Link
            className="mb-2 flex items-center group-data-[state=collapsed]:justify-center"
            href="/"
          >
            <Logo className="group-data-[state=collapsed]:hidden" />
            <LogoIcon className="hidden size-7 group-data-[state=collapsed]:block" />
          </Link>
          <div className="mb-2 group-data-[state=collapsed]:hidden">
            <OrganizationSwitcher />
          </div>
          <Button
            asChild
            className="flex w-full items-center group-data-[state=collapsed]:hidden"
            data-tour="create-post"
          >
            <Link href="/post">
              <span className="mr-2 flex h-4 w-4 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
                <Pencil />
              </span>
              Create Post
            </Link>
          </Button>
          <Button
            asChild
            className="w-full group-data-[state=expanded]:hidden"
            data-tour="create-post"
            size="icon"
          >
            <Link href="/post">
              <span className="flex h-5 w-5 items-center justify-center [&>svg]:h-5 [&>svg]:w-5">
                <Pencil />
              </span>
            </Link>
          </Button>
        </SidebarHeader>

        <SidebarContent className="px-3">
          <SidebarMenu className="group-data-[state=collapsed]:items-center">
            {visibleNavItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className={cn(
                    "group/menu ease relative mb-1 select-none rounded-md px-3 py-2.5 transition-colors duration-100 hover:bg-accent hover:text-primary-foreground",
                    pathname === item.url &&
                      "bg-[#F9F9FA] shadow-[0px_11px_4px_rgba(7,7,8,0.01),0px_6px_4px_rgba(7,7,8,0.02),0px_3px_3px_rgba(7,7,8,0.04),0px_1px_1px_rgba(7,7,8,0.05)] before:absolute before:inset-0 before:rounded-md before:border before:border-white/5 before:content-[''] after:absolute after:inset-0 after:rounded-md after:bg-[radial-gradient(at_top,rgba(255,255,255,0.05)_5%,rgba(255,255,255,0)_100%)] after:shadow-[inset_0px_-2px_0px_0px_rgba(7,7,8,0.06)] after:content-[''] dark:bg-[#2A2A2A] dark:shadow-md dark:after:shadow-[inset_0px_-2px_0px_0px_rgba(7,7,8,0.3)]",
                    "group-data-[state=collapsed]:justify-center"
                  )}
                  data-tour={item.dataTour}
                  size="lg"
                  tooltip={{
                    children: item.title,
                    side: "right",
                    align: "center",
                    sideOffset: 10,
                  }}
                >
                  <Link
                    className={cn(
                      "relative z-10 flex py-3",
                      "group-data-[state=collapsed]:h-full group-data-[state=collapsed]:w-full group-data-[state=collapsed]:items-center group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:py-0"
                    )}
                    href={item.url}
                  >
                    <span className="flex h-5 w-5 items-center justify-center [&>svg]:h-5 [&>svg]:w-5">
                      <item.icon />
                    </span>
                    <span
                      className={cn(
                        "ml-3 font-medium text-muted-foreground text-sm",
                        "group-hover/menu:text-foreground group-data-[state=collapsed]:hidden",
                        pathname === item.url && "text-foreground"
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
                    'group rounded-md-lg px-3 transition-all hover:bg-accent hover:shadow-bevel-accent',
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
                  appearance={{
                    elements: {
                      rootBox:
                        "flex overflow-hidden w-full group-data-[state=collapsed]:justify-center",
                      userButtonOuterIdentifier:
                        "truncate pl-0 group-data-[state=collapsed]:hidden",
                      avatarBox:
                        "group-data-[state=collapsed]:w-8 group-data-[state=collapsed]:h-8",
                    },
                  }}
                  showName={sidebar?.state !== "collapsed"}
                >
                  <UserButton.MenuItems>
                    <UserButton.Link
                      href="/billing"
                      label="Billing"
                      labelIcon={<CreditCard className="h-4 w-4" />}
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
              <div className="flex shrink-0 items-center gap-px">
                <ModeToggle />
                <Button
                  asChild
                  className="shrink-0"
                  size="icon"
                  variant="ghost"
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
      <SidebarInset className="min-h-[100dvh] flex-grow pb-20 md:max-h-[98vh] md:overflow-hidden md:pb-0 dark:border">
        {children}
      </SidebarInset>
    </>
  );
};
