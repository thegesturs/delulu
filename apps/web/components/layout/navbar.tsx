"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@delulu/design-system/components/ui/accordion";
import {
  Button,
  buttonVariants,
} from "@delulu/design-system/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@delulu/design-system/components/ui/navigation-menu";
import { cn } from "@delulu/design-system/lib/utils";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  ChartNoAxesCombined,
  Code2,
  GraduationCap,
  LayoutGrid,
  LifeBuoy,
  type LucideIcon,
  Menu,
  Newspaper,
  PanelsTopLeft,
  PenLine,
  PhoneCall,
  Share2,
  Type,
  Upload,
  UsersRound,
  Video,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import Link from "next/link";
import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaThreads,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa6";
import { Logo } from "@/components/logo";
import { AnimatedDashedBorder } from "../ui/animated-dashed-border";
import ThemeToggle from "./theme-toggle";

interface MenuEntry {
  name: string;
  description: string;
  href: string;
  icon:
    | LucideIcon
    | ComponentType<{ "aria-hidden"?: boolean; className?: string }>;
}

interface MenuSection {
  label: string;
  description: string;
  href: string;
  cta: string;
  items: MenuEntry[];
}

const featureMenu: MenuSection = {
  label: "Features",
  description:
    "Everything you need to publish, automate, and grow from one workspace.",
  href: "/features",
  cta: "Explore every feature",
  items: [
    {
      name: "Multi-platform publishing",
      description:
        "Create once, tailor each version, and publish across your social accounts.",
      href: "/features/multi-platform-publishing",
      icon: Share2,
    },
    {
      name: "Social media scheduling",
      description:
        "Prepare posts now, choose a future time, and track every result.",
      href: "/features/social-media-scheduling",
      icon: CalendarDays,
    },
    {
      name: "Content calendar",
      description:
        "See every scheduled post and adjust your plan in one calendar.",
      href: "/features/content-calendar",
      icon: CalendarDays,
    },
    {
      name: "Bulk video scheduling",
      description: "Turn a prepared batch of videos into a scheduled queue.",
      href: "/features/bulk-video-scheduling",
      icon: Upload,
    },
    {
      name: "Instagram DM automation",
      description:
        "Turn Instagram comments into relevant, trackable conversations.",
      href: "/features/instagram-dm-automation",
      icon: FaInstagram,
    },
    {
      name: "Social analytics",
      description:
        "Understand reach and engagement without switching between accounts.",
      href: "/features/social-analytics",
      icon: ChartNoAxesCombined,
    },
    {
      name: "Team workspaces & approvals",
      description:
        "Manage roles, collaborate on drafts, and review posts before release.",
      href: "/features/team-approvals",
      icon: UsersRound,
    },
    {
      name: "Social media publishing API",
      description:
        "Build internal workflows on typed publishing and delivery operations.",
      href: "/features/social-media-api",
      icon: Bot,
    },
  ],
};

const toolsMenu: MenuSection = {
  label: "Free tools",
  description:
    "Plan stronger posts with practical tools that work without an account.",
  href: "/tools",
  cta: "Browse all free tools",
  items: [
    {
      name: "Caption & text tools",
      description: "Count, format, and refine social copy before you publish.",
      href: "/tools/text-tools",
      icon: Type,
    },
    {
      name: "Post previews",
      description:
        "Check how a post or profile will look on each social channel.",
      href: "/tools/social-previews",
      icon: PanelsTopLeft,
    },
    {
      name: "Feed planners",
      description:
        "Arrange a profile grid or scrolling feed before it goes live.",
      href: "/tools/feed-planners",
      icon: LayoutGrid,
    },
    {
      name: "Social calendar",
      description:
        "Find timely dates and campaign moments worth planning around.",
      href: "/tools/holiday-calendar",
      icon: CalendarDays,
    },
    {
      name: "News content ideas",
      description:
        "Find current stories by country or topic and turn them into drafts.",
      href: "/tools/news-explorer",
      icon: Newspaper,
    },
    {
      name: "YouTube video trimmer",
      description:
        "Cut a useful clip in your browser without a watermark or signup.",
      href: "/tools/youtube-video-trimmer",
      icon: Video,
    },
  ],
};

const integrationsMenu: MenuSection = {
  label: "Integrations",
  description:
    "Connect the channels your audience already uses and manage them together.",
  href: "/integrations",
  cta: "See all integrations",
  items: [
    {
      name: "Instagram",
      description:
        "Publish posts and reels, then build comment-to-DM workflows.",
      href: "/integrations/instagram",
      icon: FaInstagram,
    },
    {
      name: "Facebook",
      description: "Schedule content for connected Facebook pages.",
      href: "/integrations/facebook",
      icon: FaFacebook,
    },
    {
      name: "LinkedIn",
      description: "Plan professional updates and document-led posts.",
      href: "/integrations/linkedin",
      icon: FaLinkedin,
    },
    {
      name: "TikTok",
      description:
        "Prepare short-form video posts with channel-specific settings.",
      href: "/integrations/tiktok",
      icon: FaTiktok,
    },
    {
      name: "YouTube",
      description:
        "Schedule Shorts with the right title, description, and visibility.",
      href: "/integrations/youtube",
      icon: FaYoutube,
    },
    {
      name: "Threads",
      description:
        "Draft and schedule conversational posts alongside every campaign.",
      href: "/integrations/threads",
      icon: FaThreads,
    },
  ],
};

const resourcesMenu: MenuSection = {
  label: "Resources",
  description:
    "Guides and support for building a calmer social publishing workflow.",
  href: "/blogs",
  cta: "Read the latest guides",
  items: [
    {
      name: "Blog",
      description:
        "Practical playbooks for publishing, automation, and growth.",
      href: "/blogs",
      icon: PenLine,
    },
    {
      name: "Documentation",
      description:
        "Set up Delulu, connect accounts, and publish from your workflow.",
      href: "https://docs.delulu.social",
      icon: GraduationCap,
    },
    {
      name: "Developer resources",
      description:
        "Build publishing workflows with the API, CLI, and MCP server.",
      href: "https://docs.delulu.social/docs/api-reference",
      icon: Code2,
    },
    {
      name: "Help & support",
      description:
        "Get help resolving a setup, publishing, or account question.",
      href: "/contact",
      icon: LifeBuoy,
    },
    {
      name: "Schedule a call",
      description:
        "Talk through the product, your workflow, and the best way to get started.",
      href: "https://cal.com/swaraj",
      icon: PhoneCall,
    },
  ],
};

const menuSections = [featureMenu, toolsMenu, integrationsMenu, resourcesMenu];

export const Navbar = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > 100);
  });

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="sticky top-0 z-50 w-full"
      initial={{ opacity: 0 }}
      ref={ref}
      transition={{ duration: 0.2 }}
    >
      <DesktopNav />
      <MobileNav visible={visible} />
    </motion.div>
  );
};

const DesktopNav = () => (
  <AnimatedDashedBorder>
    <div className="relative z-[100] mx-auto hidden w-full max-w-7xl items-center justify-between bg-background/80 px-6 py-2.5 backdrop-blur-xl lg:flex xl:px-0">
      <Logo />

      <NavigationMenu
        className="mx-auto"
        delayDuration={80}
        skipDelayDuration={240}
      >
        <NavigationMenuList>
          {menuSections.map((section) => (
            <NavigationMenuItem key={section.label}>
              <NavigationMenuTrigger className="bg-transparent [&_svg]:duration-150">
                {section.label}
              </NavigationMenuTrigger>
              <NavigationMenuContent className="data-[motion^=from-]:!animate-none data-[motion^=to-]:!animate-none data-[state=closed]:!animate-none data-[state=open]:!animate-none">
                <MegaMenu section={section} />
              </NavigationMenuContent>
            </NavigationMenuItem>
          ))}

          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                className={cn(navigationMenuTriggerStyle(), "bg-transparent")}
                href="/pricing"
              >
                Pricing
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex shrink-0 items-center gap-2">
        <Button asChild>
          <Link href="https://solulu.delulu.social/sign-in">
            Get Freaking Started
          </Link>
        </Button>
        <ThemeToggle className="size-10" />
      </div>
    </div>
  </AnimatedDashedBorder>
);

function MegaMenu({ section }: { section: MenuSection }) {
  const compact = section.items.length <= 4;
  const dense = section.items.length >= 8;

  return (
    <div
      className={cn(
        "w-[min(48rem,calc(100vw-3rem))] p-2",
        compact && "w-[min(38rem,calc(100vw-3rem))]",
        dense && "w-[min(56rem,calc(100vw-3rem))]"
      )}
    >
      <div className="flex items-start justify-between gap-4 px-3 pt-2 pb-3">
        <div>
          <p className="font-semibold text-foreground text-sm">
            {section.label}
          </p>
          <p className="mt-1 max-w-2xl text-muted-foreground text-sm leading-5">
            {section.description}
          </p>
        </div>
        <NavigationMenuLink asChild>
          <Link
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "mt-0.5 w-fit shrink-0 gap-1.5"
            )}
            href={section.href}
          >
            {section.cta}
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        </NavigationMenuLink>
      </div>

      <div
        className={cn(
          "grid gap-1",
          compact ? "grid-cols-2" : "grid-cols-3",
          dense && "grid-cols-4"
        )}
      >
        {section.items.map((item) => (
          <NavigationMenuLink asChild key={item.href}>
            <Link
              className="min-h-17 flex-row items-start gap-2.5 border border-transparent p-2.5 hover:border-border/60 hover:bg-muted/60"
              href={item.href}
            >
              <item.icon
                aria-hidden={true}
                className="mt-0.5 size-4.5 shrink-0 text-foreground"
              />
              <span className="min-w-0">
                <span className="block font-medium text-foreground leading-5">
                  {item.name}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-muted-foreground text-xs leading-4">
                  {item.description}
                </span>
              </span>
            </Link>
          </NavigationMenuLink>
        ))}
      </div>
    </div>
  );
}

const MobileNav = ({ visible }: { visible: boolean }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <AnimatedDashedBorder>
      <div
        className={cn(
          "relative z-50 mx-auto flex w-full max-w-7xl flex-col bg-background/95 px-4 py-2.5 backdrop-blur-xl lg:hidden",
          visible && "shadow-foreground/5 shadow-lg"
        )}
      >
        <div className="flex w-full items-center justify-between">
          <Logo className="-ml-2" />
          <div className="flex items-center gap-1">
            <ThemeToggle className="size-11" />
            <button
              aria-expanded={open}
              aria-label={open ? "Close navigation" : "Open navigation"}
              className="flex size-11 touch-manipulation items-center justify-center rounded-lg text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => setOpen((current) => !current)}
              type="button"
            >
              {open ? (
                <X aria-hidden="true" className="size-5" />
              ) : (
                <Menu aria-hidden="true" className="size-5" />
              )}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-border/70 border-y bg-background/98 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl"
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              <Accordion collapsible type="single">
                {menuSections.map((section) => (
                  <AccordionItem key={section.label} value={section.label}>
                    <AccordionTrigger className="min-h-14 py-3 text-base hover:no-underline">
                      {section.label}
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="grid gap-1">
                        {section.items.map((item) => (
                          <Link
                            className="flex min-h-14 touch-manipulation items-start gap-3 rounded-lg px-2 py-2.5 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                            href={item.href}
                            key={item.href}
                            onClick={() => setOpen(false)}
                          >
                            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
                              <item.icon
                                aria-hidden={true}
                                className="size-4"
                              />
                            </span>
                            <span className="min-w-0">
                              <span className="block font-medium text-foreground text-sm leading-5">
                                {item.name}
                              </span>
                              <span className="mt-0.5 block text-muted-foreground text-xs leading-4">
                                {item.description}
                              </span>
                            </span>
                          </Link>
                        ))}
                        <Link
                          className="mt-1 flex min-h-11 touch-manipulation items-center gap-2 rounded-lg px-2 font-medium text-primary text-sm outline-none hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring"
                          href={section.href}
                          onClick={() => setOpen(false)}
                        >
                          {section.cta}
                          <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <Link
                className="flex min-h-14 touch-manipulation items-center border-border border-b font-medium text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="/pricing"
                onClick={() => setOpen(false)}
              >
                Pricing
              </Link>

              <Button asChild className="mt-4 h-11 w-full">
                <Link
                  href="https://solulu.delulu.social/sign-in"
                  onClick={() => setOpen(false)}
                >
                  Get Freaking Started
                </Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatedDashedBorder>
  );
};
