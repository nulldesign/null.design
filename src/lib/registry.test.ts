import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadRegistry, validateRegistry, type Registry } from "./registry";

const project = (over: Record<string, unknown> = {}) => ({
  id: "ND-001",
  title: "Example",
  slug: "example",
  classification: { type: ["EXPERIMENT"], practice: ["software"] },
  status: "active",
  visibility: "public",
  year: { started: 2026, ended: null },
  summary: "An example project used only for registry tests.",
  research_programs: ["ND-R01"],
  commercial: { commissionable: false, product_candidate: false, revenue_model: null },
  provenance: { ownership: "original", original_repository: null },
  publication: {
    case_study: false,
    public_url: null,
    recommendation: "FEATURE ONLY",
  },
  ...over,
});

const program = (over: Record<string, unknown> = {}) => ({
  id: "ND-R01",
  title: "Example Program",
  slug: "example-program",
  status: "active",
  visibility: "public",
  year: { started: 2026, ended: null },
  summary: "An example research program used only for registry tests.",
  projects: ["ND-001"],
  publication: { public_url: null },
  ...over,
});

const run = (over: Record<string, unknown> = {}) => ({
  id: "RUN-2026-0001",
  date: "2026-09-01",
  title: "Example run",
  trigger: "manual",
  human_director: "W. Avendano",
  status: "complete",
  result: { commit: null, publication: null },
  ...over,
});

function writeYaml(dir: string, rel: string, data: unknown) {
  mkdirSync(join(dir, rel, ".."), { recursive: true });
  // js-yaml is available to the implementation; tests write JSON, which is valid YAML.
  writeFileSync(join(dir, rel), JSON.stringify(data, null, 2));
}

function fixture(mutate: (dir: string) => void = () => {}) {
  const dir = mkdtempSync(join(tmpdir(), "nd-registry-"));
  for (const sub of ["projects", "programs", "products", "runs"]) mkdirSync(join(dir, sub));
  writeYaml(dir, "projects/ND-001.yaml", project());
  writeYaml(dir, "programs/ND-R01.yaml", program());
  writeYaml(dir, "runs/RUN-2026-0001.yaml", run());
  mutate(dir);
  return dir;
}

describe("loadRegistry", () => {
  it("loads and validates every record, indexed by id and slug", () => {
    const reg: Registry = loadRegistry(fixture());
    expect(reg.projects.map((p) => p.id)).toEqual(["ND-001"]);
    expect(reg.programs.map((p) => p.id)).toEqual(["ND-R01"]);
    expect(reg.products).toEqual([]);
    expect(reg.runs.map((r) => r.id)).toEqual(["RUN-2026-0001"]);
    expect(reg.byId.get("ND-001")?.title).toBe("Example");
    expect(reg.projectBySlug.get("example")?.id).toBe("ND-001");
    expect(reg.programBySlug.get("example-program")?.id).toBe("ND-R01");
  });

  it("applies schema defaults", () => {
    const reg = loadRegistry(fixture());
    expect(reg.projects[0].topics).toEqual([]);
    expect(reg.projects[0].provenance.review_required).toBe(false);
    expect(reg.projects[0].publication.featured).toBe(false);
  });

  it("sorts projects by id", () => {
    const reg = loadRegistry(
      fixture((dir) => {
        writeYaml(dir, "projects/ND-010.yaml", project({ id: "ND-010", slug: "ten" }));
        writeYaml(dir, "projects/ND-003.yaml", project({ id: "ND-003", slug: "three" }));
      }),
    );
    expect(reg.projects.map((p) => p.id)).toEqual(["ND-001", "ND-003", "ND-010"]);
  });

  it("throws with the file path when a record is invalid", () => {
    const dir = fixture((d) => writeYaml(d, "projects/ND-002.yaml", project({ id: "bad", slug: "x" })));
    expect(() => loadRegistry(dir)).toThrow(/ND-002\.yaml/);
  });
});

describe("validateRegistry", () => {
  it("returns no problems for a consistent registry", () => {
    expect(validateRegistry(loadRegistry(fixture()))).toEqual([]);
  });

  it("reports an id that does not match its filename", () => {
    const dir = fixture((d) => writeYaml(d, "projects/ND-009.yaml", project({ id: "ND-002", slug: "two" })));
    const problems = validateRegistry(loadRegistry(dir));
    expect(problems.some((p) => /ND-009\.yaml/.test(p) && /ND-002/.test(p))).toBe(true);
  });

  it("reports duplicate slugs and duplicate ids", () => {
    const dir = fixture((d) => {
      writeYaml(d, "projects/ND-002.yaml", project({ id: "ND-002", slug: "example" }));
    });
    const problems = validateRegistry(loadRegistry(dir));
    expect(problems.some((p) => /slug/.test(p) && /example/.test(p))).toBe(true);
  });

  it("reports references to unknown programs and projects", () => {
    const dir = fixture((d) => {
      writeYaml(d, "projects/ND-002.yaml", project({ id: "ND-002", slug: "two", research_programs: ["ND-R09"] }));
      writeYaml(d, "programs/ND-R02.yaml", program({ id: "ND-R02", slug: "p2", projects: ["ND-404"] }));
    });
    const problems = validateRegistry(loadRegistry(dir));
    expect(problems.some((p) => /ND-R09/.test(p))).toBe(true);
    expect(problems.some((p) => /ND-404/.test(p))).toBe(true);
  });

  it("reports a case study whose project is private", () => {
    const dir = fixture((d) =>
      writeYaml(
        d,
        "projects/ND-002.yaml",
        project({
          id: "ND-002",
          slug: "two",
          visibility: "private",
          publication: { case_study: true, public_url: null, recommendation: "KEEP PRIVATE" },
        }),
      ),
    );
    const problems = validateRegistry(loadRegistry(dir));
    expect(problems.some((p) => /ND-002/.test(p) && /private/.test(p))).toBe(true);
  });

  it("reports a DO NOT PUBLISH project that is public", () => {
    const dir = fixture((d) =>
      writeYaml(
        d,
        "projects/ND-002.yaml",
        project({ id: "ND-002", slug: "two", classification: { type: ["DO NOT PUBLISH"], practice: ["software"] } }),
      ),
    );
    const problems = validateRegistry(loadRegistry(dir));
    expect(problems.some((p) => /ND-002/.test(p) && /DO NOT PUBLISH/.test(p))).toBe(true);
  });
});
