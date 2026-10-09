"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { themeStorageKey } from "@/lib/theme";

function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

export function ThemeToggle() {
  function toggle() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(themeStorageKey, next);
    } catch {
      /* 隐私模式下写不了，忽略即可 */
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="切换主题"
            data-testid="theme-toggle"
            onClick={toggle}
          />
        }
      >
        <MoonIcon className="dark:hidden" />
        <SunIcon className="hidden dark:block" />
      </TooltipTrigger>
      <TooltipContent>切换深浅色主题</TooltipContent>
    </Tooltip>
  );
}
