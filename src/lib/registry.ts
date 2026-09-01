import { readdirSync, readFileSync } from "node:fs";
import { basename, extname, join, relative, resolve, sep } from "node:path";
import { load } from "js-yaml";
import { Project, Program, Product, RunRecord } from "../../registry/schema";

export interface Registry {
  projects: Project[];
  programs: Program[];
  products: Product[];
  runs: RunRecord[];
  byId: Map<string, Project | Program | Product | RunRecord>;
  projectBySlug: Map<string, Project>;
  programBySlug: Map<string, Program>;
  files: Map<string, string>;
}

interface Parser<T> {
  parse(value: unknown): T;
}

interface LoadedRecord<T extends { id: string }> {
  record: T;
  file: string;
}

const REGISTRY_EXTENSIONS = new Set([".yaml", ".yml", ".json"]);

function registryFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...registryFiles(path));
    } else if (entry.isFile() && REGISTRY_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      files.push(path);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function issueSummary(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray(error.issues)
  ) {
    return error.issues
      .map((issue: unknown) => {
        if (typeof issue !== "object" || issue === null) return String(issue);
        const path = "path" in issue && Array.isArray(issue.path) ? issue.path.join(".") : "";
        const message = "message" in issue ? String(issue.message) : String(issue);
        return path.length > 0 ? `${path}: ${message}` : message;
      })
      .join("; ");
  }

  return error instanceof Error ? error.message : String(error);
}

function loadDirectory<T extends { id: string }>(
  root: string,
  directoryName: string,
  schema: Parser<T>,
): LoadedRecord<T>[] {
  const directory = join(root, directoryName);
  let files: string[];

  try {
    files = registryFiles(directory);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as Error & { code?: string }).code === "ENOENT"
    ) {
      return [];
    }
    throw error;
  }

  return files.map((file) => {
    const relativeFile = relative(root, file).split(sep).join("/");
    try {
      const source = readFileSync(file, "utf8");
      const record = schema.parse(load(source));
      return { record, file: relativeFile };
    } catch (error: unknown) {
      throw new Error(`${relativeFile}: ${issueSummary(error)}`, { cause: error });
    }
  });
}

function setFirst<K, V>(map: Map<K, V>, key: K, value: V): void {
  if (!map.has(key)) map.set(key, value);
}

export function loadRegistry(root: string): Registry {
  const loadedProjects = loadDirectory(root, "projects", Project);
  const loadedPrograms = loadDirectory(root, "programs", Program);
  const loadedProducts = loadDirectory(root, "products", Product);
  const loadedRuns = loadDirectory(root, "runs", RunRecord);

  const projects = loadedProjects.map(({ record }) => record).sort(compareIds);
  const programs = loadedPrograms.map(({ record }) => record).sort(compareIds);
  const products = loadedProducts.map(({ record }) => record).sort(compareIds);
  const runs = loadedRuns.map(({ record }) => record).sort(compareIds);
  const byId = new Map<string, Project | Program | Product | RunRecord>();
  const projectBySlug = new Map<string, Project>();
  const programBySlug = new Map<string, Program>();
  const files = new Map<string, string>();

  for (const { record, file } of [
    ...loadedProjects,
    ...loadedPrograms,
    ...loadedProducts,
    ...loadedRuns,
  ]) {
    setFirst(byId, record.id, record);
    setFirst(files, record.id, file);
  }
  for (const project of projects) setFirst(projectBySlug, project.slug, project);
  for (const program of programs) setFirst(programBySlug, program.slug, program);

  return { projects, programs, products, runs, byId, projectBySlug, programBySlug, files };
}

function compareIds<T extends { id: string }>(left: T, right: T): number {
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

function reportDuplicates<T>(
  records: T[],
  value: (record: T) => string,
  label: string,
  describe: (record: T) => string,
): string[] {
  const groups = new Map<string, T[]>();
  for (const record of records) {
    const key = value(record);
    const group = groups.get(key);
    if (group) group.push(record);
    else groups.set(key, [record]);
  }

  const problems: string[] = [];
  for (const [key, group] of groups) {
    if (group.length > 1) {
      problems.push(`Duplicate ${label} ${key}: ${group.map(describe).join(", ")}`);
    }
  }
  return problems;
}

export function validateRegistry(reg: Registry): string[] {
  const problems: string[] = [];
  const allRecords: Array<Project | Program | Product | RunRecord> = [
    ...reg.projects,
    ...reg.programs,
    ...reg.products,
    ...reg.runs,
  ];

  for (const [id, file] of reg.files) {
    const stem = basename(file, extname(file));
    if (id !== stem) problems.push(`${file} declares id ${id}, but its filename stem is ${stem}`);
  }

  problems.push(...reportDuplicates(allRecords, (record) => record.id, "id", (record) => record.id));
  problems.push(
    ...reportDuplicates(
      reg.projects,
      (project) => project.slug,
      "project slug",
      (project) => project.id,
    ),
    ...reportDuplicates(
      reg.programs,
      (program) => program.slug,
      "program slug",
      (program) => program.id,
    ),
  );

  const projectIds = new Set(reg.projects.map((project) => project.id));
  const programIds = new Set(reg.programs.map((program) => program.id));

  for (const project of reg.projects) {
    for (const programId of project.research_programs) {
      if (!programIds.has(programId)) {
        problems.push(`Project ${project.id} references unknown research program ${programId}`);
      }
    }
    if (project.publication.case_study && project.visibility === "private") {
      problems.push(`Project ${project.id} has a case study but visibility is ${project.visibility}`);
    }
    if (project.visibility === "public" && project.classification.type.includes("DO NOT PUBLISH")) {
      problems.push(`Project ${project.id} is public but classified DO NOT PUBLISH`);
    }
  }

  for (const program of reg.programs) {
    for (const projectId of program.projects) {
      if (!projectIds.has(projectId)) {
        problems.push(`Program ${program.id} references unknown project ${projectId}`);
      }
    }
    for (const experiment of program.experiments) {
      if (experiment.project !== null && !projectIds.has(experiment.project)) {
        problems.push(
          `Program ${program.id} experiment ${experiment.id} references unknown project ${experiment.project}`,
        );
      }
    }
  }

  return problems;
}

export const REGISTRY_ROOT: string = resolve(process.cwd(), "registry");

let registry: Registry | undefined;

export function getRegistry(): Registry {
  registry ??= loadRegistry(REGISTRY_ROOT);
  return registry;
}
