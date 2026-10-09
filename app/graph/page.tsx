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
import { Separator } from "@/components/ui/separator";
import { WorkflowMap } from "@/components/workflow-map";
import { getWorkflowMap } from "@/lib/graph";

export const metadata: Metadata = {
  title: "协作地图：20 条链路怎么相交",
  description:
    "把 20 条协作链路铺成一张地图：跨链路的岗位就是换乘站，一眼看出哪些行业在共用同一批岗位、每条链路要走几个阶段。",
  alternates: { canonical: "/graph" },
};

export default function GraphPage() {
  const data = getWorkflowMap();

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>总览</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>协作地图</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">协作地图</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          每条横线是一条协作链路，长度就是它的阶段数。虚线是「换乘」——
          同一个岗位同时出现在两条以上链路里，比如生产计划/物料管理(PMC)
          同时挂在硬件产品研发、制造生产、供应链采购三条线上。
        </p>
        <p className="text-xs text-muted-foreground">
          {data.counts.lanes} 条链路 · {data.counts.stages} 个阶段 ·{" "}
          {data.counts.jobs} 个岗位 · {data.counts.sharedJobs} 个换乘岗位 ·{" "}
          {data.counts.transfers} 条换乘连线
        </p>
      </div>

      <Separator />

      <WorkflowMap data={data} />

      <section className="flex flex-col gap-2 text-xs text-muted-foreground">
        <h2 className="text-sm font-medium text-foreground">怎么读这张图</h2>
        <ul className="flex list-disc flex-col gap-1 pl-4">
          <li>远景只有线路与线路名，虚线告诉你哪些线路共用岗位。</li>
          <li>滚轮放大先出现阶段节点，再放大出现岗位与岗位名。</li>
          <li>
            带赭色圆环的岗位是换乘岗位，点它能看到它挂在哪几条链路的哪个阶段。
          </li>
          <li>点线路看这条链路的概况，可跳进单条链路的画布视图。</li>
        </ul>
      </section>
    </div>
  );
}
