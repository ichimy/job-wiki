import type { Metadata } from "next";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCategoriesWithCount, getCounts } from "@/lib/data";

export const metadata: Metadata = {
  title: "行业一览",
  description:
    "28 个行业的岗位分布：每个行业有多少分组、多少岗位，点进去逐组查看岗位与职责。",
  alternates: { canonical: "/c" },
};

export default function CategoryIndexPage() {
  const categories = getCategoriesWithCount();
  const counts = getCounts();
  const busiest = categories[0]?.jobCount ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>总览</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>行业</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">行业一览</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          按岗位数从多到少排列。岗位只在数据集里存一份，跨行业归属靠引用，所以同一个岗位可能出现在几个行业里。
        </p>
        <p className="text-xs text-muted-foreground">
          {counts.categories} 个行业 · {counts.groups} 个分组 · {counts.jobs} 个岗位 ·{" "}
          {counts.memberships} 条归属
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map(({ category, jobCount, groupCount }) => (
          <Link
            key={category.id}
            href={`/c/${category.id}`}
            data-testid="category-entry"
            className="group"
          >
            <Card
              size="sm"
              className="h-full gap-2 ring-1 ring-border/70 transition-all group-hover:ring-primary/40"
            >
              <CardHeader className="gap-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">{category.name}</CardTitle>
                  <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
                    {jobCount} 岗位
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{
                      width: `${Math.max(6, Math.round((jobCount / busiest) * 100))}%`,
                    }}
                  />
                </div>
                <CardDescription className="text-xs">
                  {groupCount} 个分组 · {category.id}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
