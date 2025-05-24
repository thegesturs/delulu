'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@delulu/design-system/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';

const languages = [
  { label: '🇬🇧 English', value: 'en' },
  { label: '🇪🇸 Español', value: 'es' },
  { label: '🇩🇪 Deutsch', value: 'de' },
  { label: '🇨🇳 中文', value: 'zh' },
  { label: '🇫🇷 Français', value: 'fr' },
  { label: '🇵🇹 Português', value: 'pt' },
];

export const LanguageSwitcher = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const switchLanguage = (locale: string) => {
    const defaultLocale = 'en';
    let newPathname = pathname;

    // Case 1: If current locale is default and missing from the URL
    if (
      !pathname.startsWith(`/${params.locale}`) &&
      params.locale === defaultLocale
    ) {
      // Add the default locale to the beginning to normalize
      newPathname = `/${params.locale}${pathname}`;
    }

    // Replace current locale with the selected one
    newPathname = newPathname.replace(`/${params.locale}`, `/${locale}`);
    console.log(newPathname);

    router.push(newPathname);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-foreground"
        >
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {languages.map(({ label, value }) => (
          <DropdownMenuItem key={value} onClick={() => switchLanguage(value)}>
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
