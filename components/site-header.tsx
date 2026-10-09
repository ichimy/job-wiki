"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { CommandPalette } from "@/components/command-palette";
import { NavSheet } from "@/components/nav-sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import type { NavCategory, NavWorkflow } from "@/lib/nav";
import { primaryNav } from "@/lib/primary-nav";

export function SiteHeader({
  categories,
  workflows,
}: {
  categories: NavCategory[];
  workflows: NavWorkflow[];
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/65">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-2 px-4 lg:gap-3 lg:px-8">
        <NavSheet categories={categories} workflows={workflows} />

        <Link
          href="/"
          aria-label="岗位全景 · 回到总览"
          className="group -ml-1 flex min-w-0 items-center gap-2.5 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-muted/60"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15 transition-colors group-hover:bg-primary/15">
            <Image
              src="/logo.png"
              alt=""
              width={20}
              height={20}
              priority
              className="size-5 rounded-sm"
            />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium tracking-tight">
              岗位全景
            </span>
            <span className="hidden truncate text-[0.68rem] text-muted-foreground xl:block">
              行业 · 分组 · 岗位 · 协作链路
            </span>
          </span>
        </Link>

        <nav
          aria-label="主导航"
          className="ml-1 hidden items-center gap-0.5 rounded-full bg-muted/60 p-0.5 lg:flex"
        >
          {primaryNav.map((item) => {
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.id}
                href={item.href}
                data-testid={`nav-${item.id}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1 text-sm whitespace-nowrap transition-all",
                  active
                    ? "bg-background font-medium text-foreground shadow-sm ring-1 ring-border/70"
                    : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <CommandPalette categories={categories} workflows={workflows} />
          <span
            aria-hidden="true"
            className="hidden h-5 w-px bg-border lg:block"
          />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
