export interface RssChannel {
  title: string;
  description: string;
  link: string;
  feedUrl: string;
  language?: string;
}

export interface RssItem {
  title: string;
  link: string;
  guid: string;
  description: string;
  pubDate: Date;
  categories?: string[];
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildRss(channel: RssChannel, items: RssItem[]): string {
  const sorted = [...items].sort(
    (a, b) => b.pubDate.getTime() - a.pubDate.getTime(),
  );

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">');
  lines.push("<channel>");
  lines.push(`<title>${escapeXml(channel.title)}</title>`);
  lines.push(`<link>${escapeXml(channel.link)}</link>`);
  lines.push(`<description>${escapeXml(channel.description)}</description>`);
  if (channel.language !== undefined) {
    lines.push(`<language>${escapeXml(channel.language)}</language>`);
  }
  lines.push(
    `<atom:link href="${escapeXml(channel.feedUrl)}" rel="self" type="application/rss+xml"/>`,
  );
  if (sorted.length > 0) {
    lines.push(`<lastBuildDate>${sorted[0].pubDate.toUTCString()}</lastBuildDate>`);
  }
  for (const item of sorted) {
    lines.push("<item>");
    lines.push(`<title>${escapeXml(item.title)}</title>`);
    lines.push(`<link>${escapeXml(item.link)}</link>`);
    lines.push(`<guid isPermaLink="false">${escapeXml(item.guid)}</guid>`);
    lines.push(`<pubDate>${item.pubDate.toUTCString()}</pubDate>`);
    lines.push(`<description>${escapeXml(item.description)}</description>`);
    for (const category of item.categories ?? []) {
      lines.push(`<category>${escapeXml(category)}</category>`);
    }
    lines.push("</item>");
  }
  lines.push("</channel>");
  lines.push("</rss>");
  return lines.join("\n");
}
