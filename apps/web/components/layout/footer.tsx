import Link from "next/link";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";
import { LANDING_LINKS } from "@/lib/landing-links";
import { Logo } from "../logo";

export function Footer() {
  const pages = [
    { title: "Agents", href: "/#agents" },
    { title: "Product", href: "/#product" },
    { title: "Open Source", href: "/#open-source" },
    { title: "Pricing", href: "/#pricing" },
    { title: "Documentation", href: LANDING_LINKS.docs },
  ];

  const socials = [
    { title: "GitHub", href: LANDING_LINKS.source },
    { title: "Twitter", href: "https://x.com/delulusocial" },
    {
      title: "LinkedIn",
      href: "https://www.linkedin.com/company/delulu-social",
    },
  ];

  const legal = [
    { title: "Privacy Policy", href: "/legal/privacy-policy" },
    { title: "Terms of Service", href: "/legal/terms-of-service" },
    { title: "Cookie Policy", href: "/legal/cookie-policy" },
  ];

  return (
    <footer className="w-full border-t px-5 py-16 sm:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-[1.25fr_1fr] lg:gap-24">
          <div className="flex flex-col items-start">
            <Logo />
            <h2 className="mt-7 max-w-md font-medium text-2xl tracking-tight sm:text-3xl">
              Open-source social scheduling infrastructure for agents, with
              humans in control.
            </h2>
            <p className="mt-4 max-w-sm text-muted-foreground leading-7">
              Connect your agent through MCP, the CLI, or the API. Use our
              hosted service or run the whole stack yourself.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <h3 className="font-semibold text-sm">Product</h3>
              <ul className="mt-5 space-y-1">
                {pages.map((item) => (
                  <li key={item.title}>
                    <Link
                      className="inline-flex min-h-11 items-center text-muted-foreground text-sm transition-colors hover:text-foreground"
                      href={item.href}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm">Community</h3>
              <ul className="mt-5 space-y-1">
                {socials.map((item) => (
                  <li key={item.title}>
                    <Link
                      className="inline-flex min-h-11 items-center text-muted-foreground text-sm transition-colors hover:text-foreground"
                      href={item.href}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm">Legal</h3>
              <ul className="mt-5 space-y-1">
                {legal.map((item) => (
                  <li key={item.title}>
                    <Link
                      className="inline-flex min-h-11 items-center text-muted-foreground text-sm transition-colors hover:text-foreground"
                      href={item.href}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-5 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">© Delulu Social</p>
          <div className="flex gap-1">
            <Link
              aria-label="Delulu source on GitHub"
              className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              href={LANDING_LINKS.source}
            >
              <FaGithub size={20} />
            </Link>
            <Link
              aria-label="Delulu on X"
              className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              href="https://x.com/delulusocial"
            >
              <FaTwitter size={20} />
            </Link>
            <Link
              aria-label="Delulu on LinkedIn"
              className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              href="https://www.linkedin.com/company/delulu-social"
            >
              <FaLinkedin size={20} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
