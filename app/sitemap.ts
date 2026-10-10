import type { MetadataRoute } from "next";
import {
  getCategories,
  getJobs,
  getMeta,
  getWorkflows,
} from "@/lib/data";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date(`${getMeta().updated}T00:00:00Z`);

  return [
    {
      url: `${siteUrl}/`,
      lastModified: updated,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/c`,
      lastModified: updated,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    {
      url: `${siteUrl}/start`,
      lastModified: updated,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    {
      url: `${siteUrl}/workflow`,
      lastModified: updated,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    ...getWorkflows().map((workflow) => ({
      url: `${siteUrl}/workflow/${workflow.id}`,
      lastModified: updated,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...getCategories().map((category) => ({
      url: `${siteUrl}/c/${category.id}`,
      lastModified: updated,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...getJobs().map((job) => ({
      url: `${siteUrl}/job/${job.id}`,
      lastModified: updated,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ];
}
