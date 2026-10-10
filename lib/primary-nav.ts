/** 一级导航（顶栏、移动端抽屉、⌘K 空状态共用同一份） */
export interface PrimaryNavItem {
  id: string;
  href: string;
  label: string;
  hint: string;
  isActive: (path: string) => boolean;
}

export const primaryNav: PrimaryNavItem[] = [
  {
    id: "overview",
    href: "/",
    label: "总览",
    hint: "28 个行业、848 个岗位的全景与统计",
    isActive: (path) => path === "/",
  },
  {
    id: "start",
    href: "/start",
    label: "从哪开始",
    hint: "三条路径：还没入行 / 想换方向 / 找位置感",
    isActive: (path) => path === "/start",
  },
  {
    id: "categories",
    href: "/c",
    label: "行业",
    hint: "按行业看分组与岗位",
    isActive: (path) => path === "/c" || path.startsWith("/c/"),
  },
  {
    id: "workflows",
    href: "/workflow",
    label: "协作链路",
    hint: "从需求到交付的岗位顺序",
    isActive: (path) => path === "/workflow" || path.startsWith("/workflow/"),
  },
];
