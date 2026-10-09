"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";
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

export function NavSheet({
  categories,
  workflows,
}: {
  categories: NavCategory[];
  workflows: NavWorkflow[];
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

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
        <Tabs defaultValue="categories" className="min-h-0 flex-1 gap-2 px-3 pb-4">
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
