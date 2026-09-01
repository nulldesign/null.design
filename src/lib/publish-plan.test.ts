import { describe, expect, it } from "vitest";
import type { Program, Project, RunRecord } from "../../registry/schema";
import type { Registry } from "./registry";
import { STAGES, findApproval, findTarget, planPublish } from "./publish-plan";

function project(overrides: Partial<Project> & Pick<Project, "id" | "slug" | "title">): Project {
  return {
    classification: { type: ["ACTIVE"], practice: ["software"] },
    status: "active",
    visibility: "public",
    year: { started: 2026, ended: null },
    summary: "A summary that is long enough to validate.",
    topics: [],
    research_programs: [],
    repositories: [],
    agents: [],
    human_gates: [],
    commercial: { commissionable: false, product_candidate: false, revenue_model: null },
    provenance: {
      ownership: "original",
      original_repository: null,
      notes: "",
      review_required: false,
      third_party: [],
      ai_coauthored: false,
    },
    publication: { case_study: true, public_url: null, featured: false, recommendation: "FEATURE ONLY" },
    facts: [],
    ...overrides,
  };
}

function program(overrides: Partial<Program> & Pick<Program, "id" | "slug" | "title">): Program {
  return {
    status: "active",
    visibility: "public",
    year: { started: 2026, ended: null },
    summary: "A summary that is long enough to validate.",
    workflow: [],
    questions: [],
    outputs: [],
    experiments: [],
    projects: [],
    publication: { public_url: null, featured: false },
    ...overrides,
  };
}

function run(overrides: Partial<RunRecord> & Pick<RunRecord, "id">): RunRecord {
  return {
    date: "2026-09-01",
    title: "A run",
    trigger: "manual",
    human_director: "A person",
    status: "running",
    inputs: [],
    tools: [],
    roles: [],
    artifacts: [],
    critiques: [],
    human_decisions: [],
    result: { commit: null, publication: null },
    ...overrides,
  };
}

function registry(parts: { projects?: Project[]; programs?: Program[]; runs?: RunRecord[] }): Registry {
  const projects = parts.projects ?? [];
  const programs = parts.programs ?? [];
  const runs = parts.runs ?? [];
  const byId = new Map<string, Project | Program | RunRecord>();
  for (const r of [...projects, ...programs, ...runs]) byId.set(r.id, r);
  return {
    projects,
    programs,
    products: [],
    runs,
    byId,
    projectBySlug: new Map(projects.map((p) => [p.slug, p])),
    programBySlug: new Map(programs.map((p) => [p.slug, p])),
    files: new Map(),
  };
}

const approvedBoth = run({
  id: "RUN-2026-0001",
  human_decisions: [
    { decision: "Attribute ND-006 and ND-007 as teacher-built exemplars; publish both case studies", outcome: "approved", date: "2026-09-01" },
    { decision: "Merge run/RUN-2026-0001 to main", outcome: "pending", date: null },
  ],
});

describe("STAGES", () => {
  it("lists the fourteen pipeline stages in order", () => {
    expect(STAGES.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    expect(STAGES.every((s) => s.name.length > 0 && s.role.length > 0)).toBe(true);
  });

  it("marks stage 11 as the gate and stages 12 and 13 as after the gate", () => {
    expect(STAGES.find((s) => s.n === 11)?.mode).toBe("gate");
    expect(STAGES.filter((s) => s.mode === "after-gate").map((s) => s.n)).toEqual([12, 13]);
  });

  it("marks validate, metadata, critique and build as automated; everything else manual", () => {
    expect(STAGES.filter((s) => s.mode === "auto").map((s) => s.n)).toEqual([1, 6, 7, 9]);
    expect(STAGES.filter((s) => s.mode === "manual").map((s) => s.n)).toEqual([2, 3, 4, 5, 8, 10, 14]);
  });
});

describe("findTarget", () => {
  const reg = registry({
    projects: [project({ id: "ND-006", slug: "stock-forecast", title: "Stock Forecast" })],
    programs: [program({ id: "ND-R01", slug: "agentic-education", title: "Agentic Education" })],
    runs: [approvedBoth],
  });

  it("resolves a project to its content and registry paths", () => {
    expect(findTarget(reg, "ND-006")).toEqual({
      kind: "project",
      id: "ND-006",
      slug: "stock-forecast",
      title: "Stock Forecast",
      contentPath: "content/work/stock-forecast.mdx",
      registryPath: "registry/projects/ND-006.yaml",
    });
  });

  it("resolves a program to research content", () => {
    expect(findTarget(reg, "ND-R01")).toMatchObject({
      kind: "program",
      contentPath: "content/research/agentic-education.mdx",
      registryPath: "registry/programs/ND-R01.yaml",
    });
  });

  it("returns null for runs, products and unknown ids", () => {
    expect(findTarget(reg, "RUN-2026-0001")).toBeNull();
    expect(findTarget(reg, "ND-P01")).toBeNull();
    expect(findTarget(reg, "ND-999")).toBeNull();
  });
});

describe("findApproval", () => {
  it("finds an approved, dated decision that names the id and the word publish", () => {
    expect(findApproval([approvedBoth], "ND-006")).toEqual({
      run: "RUN-2026-0001",
      decision: "Attribute ND-006 and ND-007 as teacher-built exemplars; publish both case studies",
      date: "2026-09-01",
    });
    expect(findApproval([approvedBoth], "ND-007")?.run).toBe("RUN-2026-0001");
  });

  it("matches the id as a whole token only", () => {
    expect(findApproval([approvedBoth], "ND-00")).toBeNull();
    const r = run({ id: "RUN-2026-0002", human_decisions: [{ decision: "Publish ND-0061", outcome: "approved", date: "2026-09-02" }] });
    expect(findApproval([r], "ND-006")).toBeNull();
  });

  it("ignores decisions that are pending, rejected, deferred, undated or silent about publishing", () => {
    const r = run({
      id: "RUN-2026-0002",
      human_decisions: [
        { decision: "Publish ND-001", outcome: "pending", date: null },
        { decision: "Publish ND-002", outcome: "rejected", date: "2026-09-02" },
        { decision: "Publish ND-003", outcome: "deferred", date: "2026-09-02" },
        { decision: "Publish ND-004", outcome: "approved", date: null },
        { decision: "Rename ND-005", outcome: "approved", date: "2026-09-02" },
      ],
    });
    for (const id of ["ND-001", "ND-002", "ND-003", "ND-004", "ND-005"]) expect(findApproval([r], id)).toBeNull();
  });

  it("matches 'publish' case-insensitively and as part of 'publication' or 'published'", () => {
    const r = run({ id: "RUN-2026-0002", human_decisions: [{ decision: "Approve publication of ND-009", outcome: "approved", date: "2026-09-02" }] });
    expect(findApproval([r], "ND-009")?.date).toBe("2026-09-02");
  });
});

describe("planPublish", () => {
  const reg = registry({
    projects: [
      project({ id: "ND-006", slug: "stock-forecast", title: "Stock Forecast" }),
      project({ id: "ND-008", slug: "unapproved", title: "Unapproved" }),
    ],
    runs: [approvedBoth],
  });

  it("throws for an id that is not a project or program", () => {
    expect(() => planPublish(reg, "ND-P01")).toThrow(/ND-P01/);
  });

  it("permits every stage up to the gate, and the post-gate stages only with an approval", () => {
    const approved = planPublish(reg, "ND-006");
    expect(approved.approval?.run).toBe("RUN-2026-0001");
    expect(approved.stages.every((s) => s.permitted)).toBe(true);

    const unapproved = planPublish(reg, "ND-008");
    expect(unapproved.approval).toBeNull();
    expect(unapproved.stages.filter((s) => !s.permitted).map((s) => s.n)).toEqual([12, 13]);
  });

  it("renders a checklist that names the target, the gate and the approval state", () => {
    const approved = planPublish(reg, "ND-006").checklist.join("\n");
    expect(approved).toContain("ND-006");
    expect(approved).toContain("stock-forecast");
    expect(approved).toContain("RUN-2026-0001");
    expect(approved).toContain("2026-09-01");

    const unapproved = planPublish(reg, "ND-008").checklist.join("\n");
    expect(unapproved).toMatch(/refused/i);
    expect(unapproved).toContain("registry/runs");
    expect(unapproved).toContain("human_decisions");
  });

  it("never includes a merge or deploy command in the checklist, approved or not", () => {
    for (const id of ["ND-006", "ND-008"]) {
      const text = planPublish(reg, id).checklist.join("\n");
      expect(text).not.toMatch(/git merge|gh pr merge|vercel (deploy|--prod)/);
    }
  });
});
