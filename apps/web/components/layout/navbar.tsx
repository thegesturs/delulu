'use client';
import { Logo } from '@/components/logo';
import { Button } from '@delulu/design-system/components/ui/button';
import { cn } from '@delulu/design-system/lib/utils';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from 'motion/react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

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
      name: 'Home',
      link: '/#home',
    },
    {
      name: 'Product',
      link: '/#product',
    },
    {
      name: 'Pricing',
      link: '/#pricing',
    },
    // {
    //   name: 'Blog',
    //   link: '/blogs',
    // },
  ];

  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-x-0 top-2 z-50 w-full"
    >
      <DesktopNav visible={visible} navItems={navItems} />
      <MobileNav visible={visible} navItems={navItems} />
    </motion.div>
  );
};

const DesktopNav = ({ navItems, visible }: NavbarProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <motion.div
      onMouseLeave={() => setHoveredIndex(null)}
      animate={{
        width: visible ? '50%' : '80%',
        backgroundColor: visible
          ? 'hsl(var(--background))'
          : 'hsl(var(--background)/.5)',
        backdropFilter: visible ? 'blur(10px)' : 'blur(5px)',
        y: visible ? 4 : 0,
        boxShadow: visible
          ? '0 10px 30px -10px hsl(var(--background)/.1)'
          : '0 0 0 transparent',
      }}
      initial={{
        width: '80%',
        scale: 0.95,
        opacity: 0,
      }}
      whileInView={{
        scale: 1,
        opacity: 1,
      }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
      className={cn(
        'relative z-[100] mx-auto hidden flex-row items-center justify-between self-center rounded-full border border-border/50 px-8 py-3 lg:flex'
      )}
    >
      <Logo />
      <motion.div
        className="flex-1 flex-row items-center justify-center space-x-2 text-sm lg:flex"
        animate={{
          scale: 1,
          justifyContent: visible ? 'flex-end' : 'center',
        }}
      >
        {navItems.map((navItem, idx) => (
          <motion.div
            key={`nav-item-${idx}`}
            onHoverStart={() => setHoveredIndex(idx)}
            className="relative"
          >
            <Link
              className="relative px-3 py-1.5 text-foreground/90 transition-colors hover:text-foreground"
              href={navItem.link}
            >
              <span className="relative z-10">{navItem.name}</span>
              {hoveredIndex === idx && (
                <motion.div
                  layoutId="menu-hover"
                  className="absolute inset-0 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    background:
                      'linear-gradient(145deg, hsl(var(--background)/.8) 0%, hsl(var(--background)/.2) 100%)',
                    boxShadow: '0 4px 15px hsl(var(--foreground)/.05)',
                  }}
                  exit={{
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.05,
                  }}
                />
              )}
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence mode="popLayout" initial={false}>
        {!visible && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{
              opacity: 1,
              x: 0,
              transition: {
                duration: 0.2,
              },
            }}
            exit={{
              opacity: 0,
              x: 20,
              transition: {
                duration: 0.2,
              },
            }}
          >
            <div className="flex items-center gap-2">
              <Button asChild>
                <Link href="/sign-in">Login</Link>
              </Button>
              {/* <Button asChild variant="default">
                <Link href="/sign-up">Signup</Link>
              </Button> */}
              {/* <ModeToggle /> */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const MobileNav = ({ navItems, visible }: NavbarProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.div
        animate={{
          backdropFilter: 'blur(16px)',
          background: visible
            ? 'hsl(var(--background)/.95)'
            : 'hsl(var(--background)/.8)',
          width: visible ? '85%' : '90%',
          y: visible ? 4 : 0,
          borderRadius: open ? '24px' : 'full',
          padding: '12px 20px',
          boxShadow: visible
            ? '0 10px 30px -10px hsl(var(--foreground)/.1)'
            : '0 0 0 transparent',
        }}
        initial={{
          width: '85%',
          scale: 0.95,
          opacity: 0,
        }}
        whileInView={{
          scale: 1,
          opacity: 1,
        }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
        }}
        className={cn(
          'relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between border border-border/50 lg:hidden'
        )}
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
              initial={{
                opacity: 0,
                height: 0,
                y: -10,
              }}
              animate={{
                opacity: 1,
                height: 'auto',
                y: 0,
              }}
              exit={{
                opacity: 0,
                height: 0,
                y: -10,
              }}
              transition={{
                duration: 0.2,
                ease: 'easeInOut',
              }}
              className="absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-2xl border border-border/50 bg-background/95 px-6 py-6 shadow-lg backdrop-blur-xl"
            >
              {navItems.map(
                (navItem: { link: string; name: string }, idx: number) => (
                  <motion.div
                    key={`link=${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      transition: {
                        delay: idx * 0.05,
                      },
                    }}
                    whileHover={{ x: 5 }}
                  >
                    <Link
                      href={navItem.link}
                      onClick={() => setOpen(false)}
                      className="relative text-foreground/90 transition-colors hover:text-foreground"
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
    </>
  );
};
