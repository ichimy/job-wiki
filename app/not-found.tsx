import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4 py-16">
      <h1 className="text-xl font-medium">没有这个页面</h1>
      <p className="text-sm text-muted-foreground">
        链接可能已经变了，回到总览重新找一个行业或岗位。
      </p>
      <Link href="/" className={buttonVariants()}>
        回到总览
      </Link>
    </div>
  );
}
