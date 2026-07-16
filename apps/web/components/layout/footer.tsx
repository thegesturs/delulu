import { Card } from "@delulu/design-system/components/ui/card";
import Link from "next/link";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";
import { Logo } from "../logo";

export function Footer() {
  const pages = [
    { title: "Agents", href: "/#agents" },
    { title: "Product", href: "/#product" },
    { title: "Open Source", href: "/#open-source" },
    { title: "Pricing", href: "/#pricing" },
    { title: "Documentation", href: "https://docs.delulu.social" },
  ];

  const socials = [
    { title: "GitHub", href: "https://github.com/thegesturs/delulu" },
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
    <footer className="mx-auto w-full max-w-7xl border-x border-t px-2 py-2">
      <Card className="mx-auto max-w-7xl px-8 py-20">
        <div className="flex flex-col justify-between gap-12 md:flex-row">
          <div className="flex flex-col items-start">
            <Logo />
            <h2 className="mt-8 max-w-md font-medium text-2xl">
              Open-source social scheduling infrastructure for agents, with
              humans in control.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 justify-self-end md:grid-cols-4">
            <div className="space-y-6">
              <h3 className="font-semibold">Pages</h3>
              <ul className="space-y-3">
                {pages.map((item, idx) => (
                  <li key={idx}>
                    <Link
                      className="text-muted-foreground hover:text-foreground"
                      href={item.href}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="font-semibold">Community</h3>
              <ul className="space-y-3">
                {socials.map((item, idx) => (
                  <li key={idx}>
                    <Link
                      className="text-muted-foreground hover:text-foreground"
                      href={item.href}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="font-semibold">Legal</h3>
              <ul className="space-y-3">
                {legal.map((item, idx) => (
                  <li key={idx}>
                    <Link
                      className="text-muted-foreground hover:text-foreground"
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

        <div className="mx-auto flex max-w-xs flex-col items-center justify-between pt-16 md:flex-row">
          <p className="text-muted-foreground text-sm">© Delulu Social</p>
          <div className="mt-4 flex gap-4 md:mt-0">
            <Link
              aria-label="Delulu source on GitHub"
              className="text-muted-foreground hover:text-foreground"
              href="https://github.com/thegesturs/delulu"
            >
              <FaGithub size={20} />
            </Link>
            <Link
              aria-label="Delulu on X"
              className="text-muted-foreground hover:text-foreground"
              href="https://x.com/delulusocial"
            >
              <FaTwitter size={20} />
            </Link>
            <Link
              aria-label="Delulu on LinkedIn"
              className="text-muted-foreground hover:text-foreground"
              href="https://www.linkedin.com/company/delulu-social"
            >
              <FaLinkedin size={20} />
            </Link>
          </div>
        </div>
      </Card>
    </footer>
  );
}
