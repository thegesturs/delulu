import { Button } from "@delulu/design-system/components/ui/button";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Compass,
  Hash,
  Home,
  Search,
  Send,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

export const metadata: Metadata = {
  title: "Page not found | Delulu Social",
  description:
    "That page could not be found. Head back to Delulu Social or explore free social media tools and publishing guides.",
  robots: {
    follow: true,
    index: false,
  },
};

interface FloatingDetailProps {
  className: string;
  floatId: string;
  icon: ComponentType<{ "aria-hidden"?: boolean; className?: string }>;
  label: string;
  rotationClassName: string;
}

function FloatingDetail({
  className,
  floatId,
  icon: Icon,
  label,
  rotationClassName,
}: FloatingDetailProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute hidden md:block ${rotationClassName} ${className}`}
    >
      <div
        className="not-found-float flex items-center gap-2 rounded-xl border border-border/70 bg-card/90 px-3 py-2 text-muted-foreground text-xs shadow-sm backdrop-blur-sm"
        data-float={floatId}
      >
        <Icon aria-hidden={true} className="size-4 text-primary" />
        {label}
      </div>
    </div>
  );
}

function FloatingSocial({
  className,
  floatId,
  icon: Icon,
}: Omit<FloatingDetailProps, "label" | "rotationClassName">) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute hidden md:block ${className}`}
    >
      <div
        className="not-found-float grid size-10 place-items-center rounded-full border border-border/70 bg-card/90 text-foreground/70 shadow-sm backdrop-blur-sm"
        data-float={floatId}
      >
        <Icon aria-hidden={true} className="size-4" />
      </div>
    </div>
  );
}

const recoveryLinks = [
  {
    title: "Free tools",
    description: "Preview, plan, trim, and refine your next post.",
    href: "/tools",
    icon: Wrench,
  },
  {
    title: "Features",
    description: "See how publishing, automation, and analytics work.",
    href: "/features",
    icon: Sparkles,
  },
  {
    title: "Guides",
    description: "Read practical ideas for a calmer content workflow.",
    href: "/blogs",
    icon: Compass,
  },
];

export default function NotFound() {
  return (
    <main className="relative mx-auto min-h-[calc(100dvh-4rem)] max-w-7xl overflow-hidden border-x bg-background px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,hsl(var(--primary)/0.13),transparent_38%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]"
      />

      <FloatingDetail
        className="top-[16%] left-[7%]"
        floatId="one"
        icon={CalendarDays}
        label="Plan"
        rotationClassName="-rotate-6"
      />
      <FloatingDetail
        className="top-[11%] right-[9%]"
        floatId="two"
        icon={Send}
        label="Publish"
        rotationClassName="rotate-6"
      />
      <FloatingDetail
        className="top-[46%] left-[3%]"
        floatId="three"
        icon={Hash}
        label="Create"
        rotationClassName="rotate-3"
      />
      <FloatingDetail
        className="top-[43%] right-[4%]"
        floatId="four"
        icon={BarChart3}
        label="Learn"
        rotationClassName="-rotate-3"
      />
      <FloatingSocial
        className="top-[31%] left-[13%]"
        floatId="two"
        icon={FaInstagram}
      />
      <FloatingSocial
        className="top-[28%] right-[14%]"
        floatId="three"
        icon={FaFacebook}
      />
      <FloatingSocial
        className="bottom-[13%] left-[12%]"
        floatId="four"
        icon={FaTiktok}
      />
      <FloatingSocial
        className="right-[13%] bottom-[11%]"
        floatId="two"
        icon={FaYoutube}
      />

      <section className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="mb-5 flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 font-medium text-primary text-sm">
          <Search aria-hidden="true" className="size-4" />
          We looked everywhere
        </div>

        <p
          aria-hidden="true"
          className="select-none bg-gradient-to-b from-foreground to-foreground/25 bg-clip-text font-black text-8xl text-transparent tracking-[-0.08em] sm:text-9xl"
        >
          404
        </p>
        <h1 className="mt-1 text-balance font-bold text-3xl tracking-tight sm:text-5xl">
          This page missed its posting window.
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground leading-7 sm:text-lg">
          The link may be old, mistyped, or moved. Your content plan is still
          safe—choose a useful next stop below.
        </p>

        <div className="mt-7 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Button asChild className="h-11 px-5">
            <Link href="/">
              <Home aria-hidden="true" className="size-4" />
              Back home
            </Link>
          </Button>
          <Button asChild className="h-11 px-5" variant="outline">
            <Link href="/tools">
              Explore free tools
              <ArrowLeft aria-hidden="true" className="size-4 rotate-180" />
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid w-full gap-3 text-left sm:grid-cols-3">
          {recoveryLinks.map((item) => (
            <Link
              className="group rounded-xl border border-border/70 bg-card/70 p-4 outline-none transition-colors hover:border-primary/25 hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href={item.href}
              key={item.href}
            >
              <item.icon aria-hidden="true" className="size-5 text-primary" />
              <span className="mt-3 block font-semibold text-foreground text-sm">
                {item.title}
              </span>
              <span className="mt-1 block text-muted-foreground text-xs leading-5">
                {item.description}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 border-border/70 border-t pt-6 sm:flex-row">
          <span className="text-muted-foreground text-sm">
            Keep up with Delulu
          </span>
          <div className="flex items-center gap-2">
            <Button asChild size="icon" variant="ghost">
              <Link
                aria-label="Follow Delulu on X"
                href="https://x.com/delulusocial"
              >
                <FaXTwitter aria-hidden={true} className="size-4" />
              </Link>
            </Button>
            <Button asChild size="icon" variant="ghost">
              <Link
                aria-label="Follow Delulu on LinkedIn"
                href="https://www.linkedin.com/company/delulu-social"
              >
                <FaLinkedin aria-hidden={true} className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
