"use client";

import Image from "next/image";
import Link from "next/link";
import { CommandPalette } from "@/components/command-palette";
import { NavSheet } from "@/components/nav-sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import type { NavCategory, NavWorkflow } from "@/lib/nav";

export function SiteHeader({
  categories,
  workflows,
}: {
  categories: NavCategory[];
  workflows: NavWorkflow[];
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-[1360px] items-center gap-2 px-4 lg:px-8">
        <NavSheet categories={categories} workflows={workflows} />
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-muted/70"
        >
          <Image
            src="/logo.png"
            alt=""
            width={26}
            height={26}
            priority
            className="size-6.5 rounded-md"
          />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium">岗位全景</span>
            <span className="hidden truncate text-[0.7rem] text-muted-foreground sm:block">
              行业 · 分组 · 岗位 · 协作链路
            </span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          <CommandPalette categories={categories} workflows={workflows} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
