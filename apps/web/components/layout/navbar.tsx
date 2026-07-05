"use client";
import { Button } from "@delulu/design-system/components/ui/button";
import { cn } from "@delulu/design-system/lib/utils";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { Logo } from "@/components/logo";
import { AnimatedDashedBorder } from "../ui/animated-dashed-border";
import ThemeToggle from "./theme-toggle";

interface NavbarProps {
  navItems: {
    name: string;
    link: string;
  }[];
  visible: boolean;
}

export const Navbar = () => {
  const navItems = [
    {
      name: "Home",
      link: "/#home",
    },
    {
      name: "Product",
      link: "/#product",
    },
    {
      name: "Pricing",
      link: "/#pricing",
    },
    {
      name: "Tools",
      link: "/tools",
    },
    {
      name: "Blog",
      link: "/blogs",
    },
  ];

  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="sticky top-0 z-50 w-full"
      initial={{ opacity: 0 }}
      ref={ref}
      transition={{ duration: 0.3 }}
    >
      <DesktopNav navItems={navItems} />
      <MobileNav navItems={navItems} visible={visible} />
    </motion.div>
  );
};

const DesktopNav = ({ navItems }: { navItems: NavbarProps["navItems"] }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <AnimatedDashedBorder>
      <div
        className={cn(
          "relative z-[100] mx-auto hidden w-full max-w-7xl flex-row items-center justify-between self-center bg-background/30 px-8 py-3 backdrop-blur-md md:px-0 lg:flex"
        )}
      >
        <Logo />
        <motion.div className="flex-1 flex-row items-center justify-center space-x-2 text-sm lg:flex">
          {navItems.map((navItem, idx) => (
            <motion.div
              className="relative"
              key={`nav-item-${idx}`}
              onHoverStart={() => setHoveredIndex(idx)}
            >
              <Link
                className="relative px-3 py-1.5 text-foreground/90 transition-colors hover:text-foreground"
                href={navItem.link}
              >
                <span className="relative z-10">{navItem.name}</span>
                {hoveredIndex === idx && (
                  <motion.div
                    animate={{
                      opacity: 1,
                      background:
                        "linear-gradient(145deg, hsl(var(--background)/.8) 0%, hsl(var(--background)/.2) 100%)",
                      boxShadow: "0 4px 15px hsl(var(--foreground)/.05)",
                    }}
                    className="absolute inset-0 rounded-full"
                    exit={{
                      opacity: 0,
                    }}
                    initial={{ opacity: 0 }}
                    layoutId="menu-hover"
                    transition={{
                      duration: 0.05,
                    }}
                  />
                )}
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex items-center gap-2">
          <Button asChild className="h-fit py-2">
            <Link href="https://solulu.delulu.social/sign-in">
              Get Freaking Started
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </AnimatedDashedBorder>
  );
};

const MobileNav = ({ navItems, visible }: NavbarProps) => {
  const [open, setOpen] = useState(false);
  return (
    <AnimatedDashedBorder>
      <motion.div
        animate={{
          backdropFilter: "blur(16px)",
          padding: "12px 20px",
          boxShadow: visible
            ? "0 10px 30px -10px hsl(var(--foreground)/.1)"
            : "0 0 0 transparent",
        }}
        className={cn(
          "relative z-50 mx-auto flex w-full max-w-7xl flex-col items-center justify-between bg-background lg:hidden"
        )}
        initial={{
          scale: 0.95,
          opacity: 0,
        }}
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, hsl(var(--border) / 0.5) 0, hsl(var(--border) / 0.5) 12px, transparent 12px, transparent 24px)",
          backgroundSize: "24px 1px",
          backgroundPosition: "bottom",
          backgroundRepeat: "repeat-x",
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        whileInView={{
          scale: 1,
          opacity: 1,
        }}
      >
        <div className="flex w-full flex-row items-center justify-between">
          <Logo />
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            {open ? (
              <FaTimes
                className="text-foreground/90 hover:text-foreground"
                onClick={() => setOpen(!open)}
              />
            ) : (
              <FaBars
                className="text-foreground/90 hover:text-foreground"
                onClick={() => setOpen(!open)}
              />
            )}
          </motion.div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              animate={{
                opacity: 1,
                height: "auto",
                y: 0,
              }}
              className="absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 border border-border/50 bg-background/95 px-6 py-6 shadow-lg backdrop-blur-xl"
              exit={{
                opacity: 0,
                height: 0,
                y: -10,
              }}
              initial={{
                opacity: 0,
                height: 0,
                y: -10,
              }}
              transition={{
                duration: 0.2,
                ease: "easeInOut",
              }}
            >
              {navItems.map(
                (navItem: { link: string; name: string }, idx: number) => (
                  <motion.div
                    animate={{
                      opacity: 1,
                      x: 0,
                      transition: {
                        delay: idx * 0.05,
                      },
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    key={`link=${idx}`}
                    whileHover={{ x: 5 }}
                  >
                    <Link
                      className="relative text-foreground/90 transition-colors hover:text-foreground"
                      href={navItem.link}
                      onClick={() => setOpen(false)}
                    >
                      <motion.span className="block">
                        {navItem.name}
                      </motion.span>
                    </Link>
                  </motion.div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatedDashedBorder>
  );
};
