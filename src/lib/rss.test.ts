import { describe, expect, it } from "vitest";
import { buildRss, escapeXml, type RssItem } from "./rss";

const channel = {
  title: "null design",
  description: "independent computational studio",
  link: "https://null.design",
  feedUrl: "https://null.design/feed.xml",
  language: "en",
};

const items: RssItem[] = [
  {
    title: "Qlass <LMS>",
    link: "https://null.design/work/qlass",
    guid: "ND-002",
    description: "Self-hostable learning management infrastructure & a gated agentic unit builder.",
    pubDate: new Date("2026-06-05T00:00:00Z"),
    categories: ["work", "learning environments"],
  },
  {
    title: "Agentic Education",
    link: "https://null.design/research/agentic-education",
    guid: "ND-R01",
    description: "Research program.",
    pubDate: new Date("2026-09-01T12:00:00Z"),
  },
];

describe("escapeXml", () => {
  it("escapes the five XML special characters", () => {
    expect(escapeXml(`a & b < c > "d" 'e'`)).toBe(
      "a &amp; b &lt; c &gt; &quot;d&quot; &apos;e&apos;",
    );
  });
});

describe("buildRss", () => {
  const xml = buildRss(channel, items);

  it("starts with an XML declaration and an rss 2.0 root with the atom namespace", () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">');
  });

  it("includes channel metadata and a self link", () => {
    expect(xml).toContain("<title>null design</title>");
    expect(xml).toContain("<link>https://null.design</link>");
    expect(xml).toContain("<language>en</language>");
    expect(xml).toContain(
      '<atom:link href="https://null.design/feed.xml" rel="self" type="application/rss+xml"/>',
    );
  });

  it("escapes item content and formats dates as RFC 822", () => {
    expect(xml).toContain("<title>Qlass &lt;LMS&gt;</title>");
    expect(xml).toContain("infrastructure &amp; a gated");
    expect(xml).toContain("<pubDate>Fri, 05 Jun 2026 00:00:00 GMT</pubDate>");
  });

  it("emits guid as a permalink=false identifier and categories", () => {
    expect(xml).toContain('<guid isPermaLink="false">ND-002</guid>');
    expect(xml).toContain("<category>learning environments</category>");
  });

  it("sorts items newest first", () => {
    expect(xml.indexOf("Agentic Education")).toBeLessThan(xml.indexOf("Qlass"));
  });

  it("sets lastBuildDate to the newest item date", () => {
    expect(xml).toContain("<lastBuildDate>Tue, 01 Sep 2026 12:00:00 GMT</lastBuildDate>");
  });

  it("produces one <item> per input", () => {
    expect(xml.match(/<item>/g)?.length).toBe(2);
  });
});
