import { Button } from '@delulu/design-system/components/ui/button';
import { Input } from '@delulu/design-system/components/ui/input';
import { Icon } from '@delulu/design-system/providers/icon';

import { ArrowRight01Icon, Search01Icon } from '@hugeicons-pro/core-solid-rounded';

export const Search = () => (
  <form action="/search" className="flex items-center gap-2 px-4">
    <div className="relative">
      <div className="absolute top-px bottom-px left-px flex h-8 w-8 items-center justify-center">
        <Icon icon={Search01Icon} size={16} className="text-muted-foreground" />
      </div>
      <Input
        type="text"
        name="q"
        placeholder="Search"
        className="h-auto bg-background py-1.5 pr-3 pl-8 text-xs"
      />
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-px right-px bottom-px h-8 w-8"
      >
        <Icon icon={ArrowRight01Icon} size={16} className="text-muted-foreground" />
      </Button>
    </div>
  </form>
);
