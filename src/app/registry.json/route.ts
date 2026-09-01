import type { Project } from "@registry/schema";
import { getRegistry } from "@/lib/registry";

export const dynamic = "force-static";

/**
 * Public, machine-readable projection of the registry.
 * Private records are omitted entirely; internal records are reduced to
 * id/title/summary so architecture-only patterns remain discoverable.
 */
/** Records under provenance review expose no repository locations or review notes, matching the HTML pages. */
function withheld(p: Project) {
  if (!p.provenance.review_required) return p;
  const { ownership, review_required, third_party, ai_coauthored } = p.provenance;
  return { ...p, repositories: [], provenance: { ownership, review_required, third_party, ai_coauthored } };
}

export function GET() {
  const reg = getRegistry();
  const visibleIds = new Set(reg.projects.filter((p) => p.visibility !== "private").map((p) => p.id));
  const projects = reg.projects
    .filter((p) => p.visibility !== "private")
    .map((p) =>
      p.visibility === "public"
        ? withheld(p)
        : {
            id: p.id,
            title: p.title,
            slug: p.slug,
            visibility: p.visibility,
            status: p.status,
            summary: p.summary,
            classification: p.classification,
          },
    );
  const body = {
    generated: new Date().toISOString().slice(0, 10),
    schema: "https://null.design/registry-schema",
    projects,
    programs: reg.programs
      .filter((p) => p.visibility === "public")
      .map((p) => ({ ...p, projects: p.projects.filter((id) => visibleIds.has(id)) })),
    products: reg.products.filter((p) => p.visibility === "public"),
    runs: reg.runs.map((r) => ({
      id: r.id,
      date: r.date,
      title: r.title,
      status: r.status,
      roles: r.roles,
      artifacts: r.artifacts,
      human_decisions: r.human_decisions,
    })),
  };
  return Response.json(body);
}
