"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { MenuIcon } from "lucide-react";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryNavList, WorkflowNavList } from "@/components/nav-list";
import type { NavCategory, NavWorkflow } from "@/lib/nav";
import { primaryNav } from "@/lib/primary-nav";

export function NavSheet({
  categories,
  workflows,
}: {
  categories: NavCategory[];
  workflows: NavWorkflow[];
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="打开导航"
            data-testid="nav-trigger"
          />
        }
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="left" className="w-[84vw] max-w-xs gap-0 p-0">
        <SheetHeader className="border-b">
          <SheetTitle>岗位全景</SheetTitle>
          <SheetDescription>
            {categories.length} 个行业 · {workflows.length} 条协作链路
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-1 border-b px-3 pb-3">
          {primaryNav.map((item) => {
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={close}
                data-testid={`sheet-nav-${item.id}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col rounded-lg px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <span>{item.label}</span>
                <span className="text-[0.7rem] font-normal opacity-70">
                  {item.hint}
                </span>
              </Link>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            className="mt-1 gap-2 text-muted-foreground"
            data-testid="sheet-search"
            onClick={() => {
              close();
              window.dispatchEvent(new Event("jobwiki:open-search"));
            }}
          >
            <SearchIcon className="size-3.5" />
            搜索岗位、职责或行业
          </Button>
        </div>
        <Tabs
          defaultValue="categories"
          className="min-h-0 flex-1 gap-2 px-3 pb-4"
        >
          <TabsList className="w-full">
            <TabsTrigger value="categories">行业</TabsTrigger>
            <TabsTrigger value="workflows">协作链路</TabsTrigger>
          </TabsList>
          <TabsContent value="categories" className="min-h-0">
            <ScrollArea className="-mr-2 h-[calc(100svh-9.5rem)] pr-2">
              <CategoryNavList categories={categories} onNavigate={close} />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="workflows" className="min-h-0">
            <ScrollArea className="-mr-2 h-[calc(100svh-9.5rem)] pr-2">
              <WorkflowNavList workflows={workflows} onNavigate={close} />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
