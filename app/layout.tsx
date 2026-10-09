import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteHeader } from "@/components/site-header";
import { SidebarNav } from "@/components/sidebar-nav";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getNavCategories, getNavWorkflows } from "@/lib/nav";
import { getMeta } from "@/lib/data";
import { themeInitScript } from "@/lib/theme";
import { siteDescription, siteName, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName}（jobWiki）`,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName,
    title: `${siteName}（jobWiki）`,
    description: siteDescription,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: siteName }],
  },
  twitter: {
    card: "summary",
    title: `${siteName}（jobWiki）`,
    description: siteDescription,
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = getNavCategories();
  const workflows = getNavWorkflows();
  const meta = getMeta();

  return (
    <html lang="zh-CN" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-svh antialiased">
        <TooltipProvider>
          <SiteHeader categories={categories} workflows={workflows} />
          <div className="mx-auto flex w-full max-w-[1440px] items-start gap-10 px-4 lg:px-8">
            <SidebarNav
              categories={categories}
              workflows={workflows}
              version={meta.version}
              updated={meta.updated}
            />
            <main className="min-w-0 flex-1 pt-6 pb-20 lg:pt-8 lg:pb-24">
              {children}
            </main>
          </div>
        </TooltipProvider>
        {/* Vercel Web Analytics + Speed Insights：只在生产注入同源脚本，
            本地开发与预览部署不加载（这两个 SDK 在 development 模式会请求
            va.vercel-scripts.com，本项目的约定是零外部请求）。 */}
        {process.env.VERCEL_ENV === "production" && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
