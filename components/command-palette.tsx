"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import type { NavCategory, NavWorkflow } from "@/lib/nav";
import { primaryNav } from "@/lib/primary-nav";

interface SearchEntry {
  id: string;
  name: string;
  duty: string;
  cat: string;
  group: string;
  stage?: string;
  flow?: string;
}

const maxResults = 40;

export function CommandPalette({
  categories,
  workflows,
}: {
  categories: NavCategory[];
  workflows: NavWorkflow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const loading = open && entries === null;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    function onOpenSearch() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("jobwiki:open-search", onOpenSearch);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("jobwiki:open-search", onOpenSearch);
    };
  }, []);

  useEffect(() => {
    if (!open || entries) return;
    fetch("/search-index.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((data: SearchEntry[]) => setEntries(data))
      .catch(() => setEntries([]));
  }, [open, entries]);

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword || !entries) return [];
    return entries
      .filter((entry) =>
        `${entry.name}\n${entry.duty}\n${entry.cat}\n${entry.group}\n${entry.stage ?? ""}\n${entry.flow ?? ""}`
          .toLowerCase()
          .includes(keyword),
      )
      .sort((a, b) => {
        const aName = a.name.toLowerCase().indexOf(keyword);
        const bName = b.name.toLowerCase().indexOf(keyword);
        return aName - bName || a.id.localeCompare(b.id);
      })
      .slice(0, maxResults);
  }, [query, entries]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const searching = query.trim().length > 0;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 justify-center gap-2 rounded-lg px-0 text-muted-foreground sm:w-60 sm:justify-start sm:px-2.5"
        aria-label="搜索岗位"
        data-testid="command-trigger"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="size-3.5 shrink-0" />
        <span className="hidden truncate sm:inline">搜索岗位、职责或行业</span>
        <kbd className="ml-auto hidden shrink-0 rounded border border-border bg-muted px-1 py-0.5 font-sans text-[0.65rem] text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="搜索岗位"
        description="按岗位名、职责或行业检索"
        className="sm:max-w-xl"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="搜索岗位、职责或行业…"
            value={query}
            onValueChange={setQuery}
            data-testid="command-input"
          />
          <CommandList className="max-h-[60svh]">
            {searching ? (
              <>
                {loading && <LoadingRows />}
                {!loading && results.length === 0 && (
                  <CommandEmpty>没有匹配的岗位</CommandEmpty>
                )}
                {results.length > 0 && (
                  <CommandGroup heading={`岗位（${results.length}）`}>
                    {results.map((entry) => (
                      <CommandItem
                        key={entry.id}
                        value={`${entry.id} ${entry.name}`}
                        data-testid="command-job-item"
                        onSelect={() => go(`/job/${entry.id}`)}
                        className="items-start gap-3 py-2"
                      >
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="font-medium">{entry.name}</span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {entry.cat}
                            {entry.stage ? ` · ${entry.stage}` : ` · ${entry.duty}`}
                          </span>
                        </span>
                        <span className="ml-auto shrink-0 self-center font-mono text-[0.7rem] text-muted-foreground">
                          {entry.id}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            ) : (
              <>
                {loading && <LoadingRows />}
                <CommandGroup heading="视图">
                  {primaryNav.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`view ${item.label}`}
                      data-testid="command-view-item"
                      onSelect={() => go(item.href)}
                      className="items-start gap-3 py-2"
                    >
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.hint}
                        </span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="行业">
                  {categories.map((category) => (
                    <CommandItem
                      key={category.id}
                      value={`category ${category.id} ${category.name}`}
                      data-testid="command-category-item"
                      onSelect={() => go(`/c/${category.id}`)}
                      className="gap-2"
                    >
                      <span className="truncate">{category.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {category.jobCount}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="协作链路">
                  {workflows.map((workflow) => (
                    <CommandItem
                      key={workflow.id}
                      value={`workflow ${workflow.id} ${workflow.name}`}
                      data-testid="command-workflow-item"
                      onSelect={() => go(`/workflow/${workflow.id}`)}
                      className="gap-2"
                    >
                      <span className="truncate">{workflow.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {workflow.stageCount} 阶段
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2 p-2" data-testid="command-loading">
      {[0, 1, 2, 3, 4].map((row) => (
        <Skeleton key={row} className="h-7 w-full" />
      ))}
    </div>
  );
}
