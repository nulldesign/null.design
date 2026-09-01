import type { MetadataRoute } from "next";
import { getRegistry } from "@/lib/registry";
import { hasContent } from "@/lib/content";
import { isPublished } from "@/components/registry-views";
import { SITE } from "@/app/layout";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const reg = getRegistry();
  const now = new Date();
  const fixed = ["", "/work", "/research", "/process", "/studio", "/dev/null"].map((p) => ({
    url: `${SITE.url}${p}`,
    lastModified: now,
  }));
  const work = reg.projects
    .filter((p) => p.visibility === "public" && isPublished(p, hasContent("work", p.slug)))
    .map((p) => ({ url: `${SITE.url}/work/${p.slug}`, lastModified: now }));
  const research = reg.programs
    .filter((p) => p.visibility === "public")
    .map((p) => ({ url: `${SITE.url}/research/${p.slug}`, lastModified: now }));
  return [...fixed, ...work, ...research];
}
