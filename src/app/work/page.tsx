import type { Metadata } from "next";
import { getRegistry } from "@/lib/registry";
import { hasContent } from "@/lib/content";
import { Page, PageTitle } from "@/components/site";
import { CatalogueTable, isPublished } from "@/components/registry-views";

export const metadata: Metadata = {
  title: "Work",
  description: "The Null Design catalogue: systems, experiments and infrastructure, indexed by stable ID.",
};

export default function WorkIndex() {
  const reg = getRegistry();
  const pub = reg.projects.filter((p) => p.visibility === "public");
  const internal = reg.projects.filter((p) => p.visibility === "internal");
  const hidden = reg.projects.length - pub.length - internal.length;
  const row = (p: (typeof reg.projects)[number]) => ({
    p,
    href: isPublished(p, hasContent("work", p.slug)) ? `/work/${p.slug}` : null,
  });

  return (
    <Page>
      <PageTitle
        kicker={`Work — ${pub.length + internal.length} entries shown${hidden ? ` · ${hidden} private records not shown` : ""}`}
        title="Catalogue"
        lede="Every entry has a permanent ID, a registry record and a provenance statement. Entries without a link are recorded but not yet written up, or are held pending a decision noted in the run record. Entries marked architecture only describe a pattern whose repositories and data remain private."
      />
      <CatalogueTable caption="Public projects" rows={pub.map(row)} />
      {internal.length > 0 && (
        <div className="mt-16">
          <CatalogueTable caption="Private infrastructure — architecture only" rows={internal.map(row)} />
        </div>
      )}
      <p className="meta mt-16">
        Source: <span className="mono normal-case">/registry/projects/*.yaml</span> · machine-readable at{" "}
        <a className="link normal-case" href="/registry.json">
          /registry.json
        </a>
      </p>
    </Page>
  );
}
