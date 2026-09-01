import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { getRegistry, validateRegistry } from "../src/lib/registry";
import { compareFacts, parseFactsTable } from "../src/lib/facts";

const registry = getRegistry();
const problems = validateRegistry(registry);

// Cross-check MDX frontmatter against the registry (AGENTS.md §4: the registry wins).
const CONTENT_ROOT = resolve(process.cwd(), "content");
const sections: Array<["work" | "research", Map<string, { id: string; title: string }>]> = [
  ["work", new Map(registry.projects.map((p) => [p.slug, p]))],
  ["research", new Map(registry.programs.map((p) => [p.slug, p]))],
];

function frontmatter(file: string): Record<string, string> {
  const src = readFileSync(file, "utf8");
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  const out: Record<string, string> = {};
  if (!m) return out;
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
}

for (const [section, bySlug] of sections) {
  const dir = join(CONTENT_ROOT, section);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".mdx") || f.startsWith("_")) continue;
    const slug = f.replace(/\.mdx$/, "");
    const fm = frontmatter(join(dir, f));
    const record = bySlug.get(slug);
    if (!record) {
      problems.push(`content/${section}/${f} has no registry record with slug "${slug}"`);
      continue;
    }
    if (fm.id !== record.id) problems.push(`content/${section}/${f} frontmatter id "${fm.id}" ≠ registry ${record.id}`);
    if (fm.slug !== slug) problems.push(`content/${section}/${f} frontmatter slug "${fm.slug}" ≠ filename slug "${slug}"`);
    if (fm.title !== record.title) problems.push(`content/${section}/${f} frontmatter title "${fm.title}" ≠ registry "${record.title}"`);
    if (section === "work") {
      const project = registry.projects.find((p) => p.id === record.id);
      const facts = parseFactsTable(readFileSync(join(dir, f), "utf8"));
      // A record with no facts may omit the table; otherwise the table must mirror the registry.
      if (project && (project.facts.length > 0 || facts !== null)) problems.push(...compareFacts(project.id, project.facts, facts));
    }
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exitCode = 1;
} else {
  console.log(
    `Registry valid: ${registry.projects.length} projects, ${registry.programs.length} programs, ${registry.products.length} products, ${registry.runs.length} runs; MDX frontmatter and facts tables consistent.`,
  );
}
