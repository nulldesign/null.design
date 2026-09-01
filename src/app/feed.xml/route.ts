import { getRegistry } from "@/lib/registry";
import { hasContent } from "@/lib/content";
import { isPublished } from "@/components/registry-views";
import { buildRss, type RssItem } from "@/lib/rss";
import { SITE } from "@/app/layout";

export const dynamic = "force-static";

export function GET() {
  const reg = getRegistry();
  const items: RssItem[] = [];

  for (const p of reg.projects) {
    if (p.visibility !== "public" || !isPublished(p, hasContent("work", p.slug))) continue;
    items.push({
      title: `${p.id} — ${p.title}`,
      link: `${SITE.url}/work/${p.slug}`,
      guid: p.id,
      description: p.summary,
      pubDate: p.publication.published
        ? new Date(`${p.publication.published}T00:00:00Z`)
        : new Date(Date.UTC(p.year.started, 0, 1)),
      categories: ["work", ...p.classification.practice],
    });
  }
  for (const pr of reg.programs) {
    if (pr.visibility !== "public") continue;
    items.push({
      title: `${pr.id} — ${pr.title}`,
      link: `${SITE.url}/research/${pr.slug}`,
      guid: pr.id,
      description: pr.summary,
      pubDate: pr.publication.published
        ? new Date(`${pr.publication.published}T00:00:00Z`)
        : new Date(Date.UTC(pr.year.started, 0, 1)),
      categories: ["research"],
    });
  }

  const xml = buildRss(
    {
      title: `${SITE.name} — ${SITE.byline}`,
      description: SITE.description,
      link: SITE.url,
      feedUrl: `${SITE.url}/feed.xml`,
      language: "en",
    },
    items,
  );

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
