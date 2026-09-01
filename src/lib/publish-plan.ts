import type { Program, Project, RunRecord } from "../../registry/schema";
import type { Registry } from "./registry";

export type StageMode = "auto" | "manual" | "gate" | "after-gate";

export interface Stage {
  n: number;
  name: string;
  role: string;
  mode: StageMode;
}

export const STAGES: readonly Stage[] = [
  { n: 1, name: "validate registry", role: "Operator", mode: "auto" },
  { n: 2, name: "inspect repository", role: "Scout", mode: "manual" },
  { n: 3, name: "collect artifacts", role: "Scout", mode: "manual" },
  { n: 4, name: "draft case study", role: "Researcher", mode: "manual" },
  { n: 5, name: "verify provenance", role: "Critic", mode: "manual" },
  { n: 6, name: "generate metadata", role: "Builder", mode: "auto" },
  { n: 7, name: "run critique", role: "Critic", mode: "auto" },
  { n: 8, name: "create branch", role: "Publisher", mode: "manual" },
  { n: 9, name: "build", role: "Publisher", mode: "auto" },
  { n: 10, name: "preview", role: "Publisher", mode: "manual" },
  { n: 11, name: "human approval", role: "human", mode: "gate" },
  { n: 12, name: "merge", role: "Publisher", mode: "after-gate" },
  { n: 13, name: "deploy", role: "Publisher", mode: "after-gate" },
  { n: 14, name: "archive run", role: "Archivist", mode: "manual" },
];

export interface Approval {
  run: string;
  decision: string;
  date: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decisionNamesId(decision: string, id: string): boolean {
  const idAsWholeToken = new RegExp(
    `(^|[^A-Za-z0-9-])${escapeRegExp(id)}($|[^A-Za-z0-9-])`,
  );
  return idAsWholeToken.test(decision);
}

export function findApproval(runs: RunRecord[], id: string): Approval | null {
  for (const run of runs) {
    for (const decision of run.human_decisions) {
      if (
        decision.outcome === "approved" &&
        decision.date !== null &&
        decisionNamesId(decision.decision, id) &&
        /publi(sh|c)/i.test(decision.decision)
      ) {
        return {
          run: run.id,
          decision: decision.decision,
          date: decision.date,
        };
      }
    }
  }

  return null;
}

export interface Target {
  kind: "project" | "program";
  id: string;
  slug: string;
  title: string;
  contentPath: string;
  registryPath: string;
}

function projectTarget(project: Project): Target {
  return {
    kind: "project",
    id: project.id,
    slug: project.slug,
    title: project.title,
    contentPath: `content/work/${project.slug}.mdx`,
    registryPath: `registry/projects/${project.id}.yaml`,
  };
}

function programTarget(program: Program): Target {
  return {
    kind: "program",
    id: program.id,
    slug: program.slug,
    title: program.title,
    contentPath: `content/research/${program.slug}.mdx`,
    registryPath: `registry/programs/${program.id}.yaml`,
  };
}

export function findTarget(registry: Registry, id: string): Target | null {
  const project = registry.projects.find((candidate) => candidate.id === id);
  if (project) return projectTarget(project);

  const program = registry.programs.find((candidate) => candidate.id === id);
  if (program) return programTarget(program);

  return null;
}

export interface PlannedStage extends Stage {
  permitted: boolean;
}

export interface Plan {
  target: Target;
  approval: Approval | null;
  stages: PlannedStage[];
  checklist: string[];
}

function removeProhibitedCommands(line: string): string {
  return line
    .replace(/git\s+merge/gi, "[prohibited merge command]")
    .replace(/gh\s+pr\s+merge/gi, "[prohibited merge command]")
    .replace(/vercel\s+deploy/gi, "[prohibited deploy command]")
    .replace(/vercel\s+--prod/gi, "[prohibited deploy command]");
}

export function planPublish(registry: Registry, id: string): Plan {
  const target = findTarget(registry, id);
  if (target === null) {
    throw new Error(`Cannot plan publication for ${id}: no project or program found`);
  }

  const approval = findApproval(registry.runs, id);
  const stages: PlannedStage[] = STAGES.map((stage) => ({
    ...stage,
    permitted: stage.mode !== "after-gate" || approval !== null,
  }));

  const checklist = [
    `Target: id=${target.id} | slug=${target.slug} | title=${target.title}`,
    ...stages.map(
      (stage) =>
        `Stage ${stage.n}: ${stage.name} | role=${stage.role} | mode=${stage.mode} | permitted=${stage.permitted ? "yes" : "no"}`,
    ),
    approval === null
      ? `Stages 12-13 refused: registry/runs must contain an approved, dated human_decisions entry naming ${target.id} and publish before they may run.`
      : `Approval: run=${approval.run} | decision=${approval.decision} | date=${approval.date}`,
  ].map(removeProhibitedCommands);

  return { target, approval, stages, checklist };
}
