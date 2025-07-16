import Link from 'next/link';
import { FaLinkedin, FaTwitter } from 'react-icons/fa';
import { Logo } from '../logo';

export function Footer() {
  const pages = [
    { title: 'Home', href: '/' },
    // { title: 'Blogs', href: '/blogs' },
    // { title: 'Pricing', href: '/pricing' },
    // { title: 'Blog', href: '/blogs' },
    // { title: 'Contact', href: '/contact' },
  ];

  const socials = [
    // { title: 'Facebook', href: 'https://www.facebook.com/delulu.social' },
    // { title: 'Instagram', href: 'https://www.instagram.com/delulu.social' },
    { title: 'Twitter', href: 'https://x.com/delulu_social' },
    {
      title: 'LinkedIn',
      href: 'https://www.linkedin.com/company/delulu-social',
    },
  ];

  const legal = [
    { title: 'Privacy Policy', href: '/legal/privacy-policy' },
    { title: 'Terms of Service', href: '/legal/terms-of-service' },
    { title: 'Cookie Policy', href: '/legal/cookie-policy' },
  ];

  return (
    <footer className="m-10 mx-auto w-full max-w-7xl rounded-xl bg-gray-50">
      <div className="mx-auto max-w-7xl px-8 py-20">
        <div className="flex flex-col justify-between gap-12 md:flex-row">
          <div className="flex flex-col items-start">
            <Logo />
            <h2 className="mt-8 max-w-md font-medium text-2xl">
              Record your video. Edit captions for each platform. Hit
              ‘Schedule.’ We handle the rest.”
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 justify-self-end md:grid-cols-4">
            <div className="space-y-6">
              <h3 className="font-semibold">Pages</h3>
              <ul className="space-y-3">
                {pages.map((item, idx) => (
                  <li key={idx}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="font-semibold">Socials</h3>
              <ul className="space-y-3">
                {socials.map((item, idx) => (
                  <li key={idx}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground"
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
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground"
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
              href="https://x.com/delulu_social"
              className="text-muted-foreground hover:text-foreground"
            >
              <FaTwitter size={20} />
            </Link>
            <Link
              href="https://www.linkedin.com/company/delulu-social"
              className="text-muted-foreground hover:text-foreground"
            >
              <FaLinkedin size={20} />
            </Link>
            {/* <Link
              href="https://www.facebook.com/delulu.social"
              className="text-muted-foreground hover:text-foreground"
            >
              <FaGithub size={20} />
            </Link> */}
            {/* <Link
              href="#"
              className="text-muted-foreground hover:text-foreground"
            >
              <FaFacebook size={20} />
            </Link> */}
            {/* <Link
              href="https://www.instagram.com/delulu.social"
              className="text-muted-foreground hover:text-foreground"
            >
              <FaInstagram size={20} />
            </Link> */}
          </div>
        </div>
      </div>
    </footer>
  );
}
