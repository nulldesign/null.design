import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { languageFindings, leakageFindings, type Finding } from "../src/lib/checks";
import { planPublish } from "../src/lib/publish-plan";
import { getRegistry, validateRegistry } from "../src/lib/registry";

const USAGE = "Usage: npx tsx scripts/publish.ts <ID> [--dry-run]";

export type ParsedArgs =
  | { id: string; dryRun: boolean }
  | { error: string };

export interface FindingFile {
  path: string;
  text: string;
  language: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
  let id: string | undefined;
  let dryRun = false;

  for (const argument of argv) {
    if (argument === "--dry-run") {
      if (dryRun) return { error: "--dry-run may only be specified once" };
      dryRun = true;
      continue;
    }
    if (argument.startsWith("-")) {
      return { error: `Unknown flag: ${argument}` };
    }
    if (id !== undefined) {
      return { error: "Expected exactly one publication ID" };
    }
    id = argument;
  }

  return id === undefined ? { error: "Missing publication ID" } : { id, dryRun };
}

function formatFinding(path: string, finding: Finding): string {
  return `${path}:${finding.line} [${finding.check}] ${finding.match}`;
}

export function findingsFor(files: FindingFile[]): string[] {
  return files.flatMap((file) => {
    const findings = leakageFindings(file.text);
    if (file.language) findings.push(...languageFindings(file.text));
    return findings.map((finding) => formatFinding(file.path, finding));
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function main(argv: string[] = process.argv.slice(2)): void {
  const parsed = parseArgs(argv);
  if ("error" in parsed) {
    console.error(USAGE);
    process.exitCode = 2;
    return;
  }

  let registry: ReturnType<typeof getRegistry>;
  try {
    registry = getRegistry();
  } catch (error: unknown) {
    console.error(errorMessage(error));
    process.exitCode = 1;
    return;
  }

  const validationProblems = validateRegistry(registry);
  if (validationProblems.length > 0) {
    for (const problem of validationProblems) console.error(problem);
    process.exitCode = 1;
    return;
  }

  let plan: ReturnType<typeof planPublish>;
  try {
    plan = planPublish(registry, parsed.id);
  } catch (error: unknown) {
    console.error(errorMessage(error));
    process.exitCode = 2;
    return;
  }

  const files: FindingFile[] = [];
  if (existsSync(plan.target.contentPath)) {
    files.push({
      path: plan.target.contentPath,
      text: readFileSync(plan.target.contentPath, "utf8"),
      language: true,
    });
  }
  files.push({
    path: plan.target.registryPath,
    text: readFileSync(plan.target.registryPath, "utf8"),
    language: false,
  });

  const findings = findingsFor(files);
  for (const finding of findings) console.log(finding);

  let buildFailed = false;
  if (parsed.dryRun) {
    console.log("stage 9 build: skipped (--dry-run)");
  } else {
    const build = spawnSync("npm", ["run", "build"], { stdio: "inherit" });
    buildFailed = build.status !== 0;
    if (build.error !== undefined) console.error(build.error.message);
  }

  for (const line of plan.checklist) console.log(line);

  process.exitCode = !parsed.dryRun && (findings.length > 0 || buildFailed) ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
