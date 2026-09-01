export type IdKind = "project" | "program" | "experiment" | "product" | "run";

export interface ParsedId {
  kind: IdKind;
  number: number;
  raw: string;
  year?: number;
}

const KIND_ORDER: readonly IdKind[] = ["project", "program", "experiment", "product", "run"];

interface Pattern {
  kind: IdKind;
  regex: RegExp;
  width: number;
}

const PATTERNS: readonly Pattern[] = [
  { kind: "project", regex: /^ND-(\d{3})$/, width: 3 },
  { kind: "program", regex: /^ND-R(\d{2})$/, width: 2 },
  { kind: "experiment", regex: /^AE-(\d{3})$/, width: 3 },
  { kind: "product", regex: /^ND-P(\d{2})$/, width: 2 },
  { kind: "run", regex: /^RUN-(\d{4})-(\d{4})$/, width: 4 },
];

export function parseId(id: string): ParsedId | null {
  for (const pattern of PATTERNS) {
    const match = pattern.regex.exec(id);
    if (!match) continue;
    if (pattern.kind === "run") {
      const year = Number(match[1]);
      const number = Number(match[2]);
      return { kind: "run", number, year, raw: id };
    }
    return { kind: pattern.kind, number: Number(match[1]), raw: id };
  }
  return null;
}

export function isValidId(id: string, kind?: IdKind): boolean {
  const parsed = parseId(id);
  if (!parsed) return false;
  if (kind === undefined) return true;
  return parsed.kind === kind;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

export function formatId(kind: Exclude<IdKind, "run">, n: number): string {
  switch (kind) {
    case "project":
      return `ND-${pad(n, 3)}`;
    case "program":
      return `ND-R${pad(n, 2)}`;
    case "experiment":
      return `AE-${pad(n, 3)}`;
    case "product":
      return `ND-P${pad(n, 2)}`;
  }
}

export function formatRunId(year: number, n: number): string {
  return `RUN-${year}-${pad(n, 4)}`;
}

export function nextId(kind: IdKind, existing: string[], year?: number): string {
  if (kind === "run") {
    if (year === undefined) {
      throw new Error("nextId: year is required for run ids");
    }
    let max = 0;
    for (const id of existing) {
      const parsed = parseId(id);
      if (parsed && parsed.kind === "run" && parsed.year === year && parsed.number > max) {
        max = parsed.number;
      }
    }
    return formatRunId(year, max + 1);
  }
  let max = 0;
  for (const id of existing) {
    const parsed = parseId(id);
    if (parsed && parsed.kind === kind && parsed.number > max) {
      max = parsed.number;
    }
  }
  return formatId(kind, max + 1);
}

export function compareIds(a: string, b: string): number {
  const pa = parseId(a);
  const pb = parseId(b);
  if (!pa && !pb) return a < b ? -1 : a > b ? 1 : 0;
  if (!pa) return 1;
  if (!pb) return -1;
  const ka = KIND_ORDER.indexOf(pa.kind);
  const kb = KIND_ORDER.indexOf(pb.kind);
  if (ka !== kb) return ka - kb;
  if (pa.kind === "run" && pb.kind === "run") {
    const ya = pa.year ?? 0;
    const yb = pb.year ?? 0;
    if (ya !== yb) return ya - yb;
  }
  return pa.number - pb.number;
}
