"use client";

import { Moon, Sun } from "@hugeicons/core-free-icons";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Icon } from "../providers/icon";

const themes = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

export const ModeToggle = () => {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="shrink-0 text-foreground"
          size="icon"
          variant="ghost"
        >
          <Icon
            className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
            icon={Sun}
            size={20}
          />
          <Icon
            className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
            icon={Moon}
            size={20}
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {themes.map(({ label, value }) => (
          <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
