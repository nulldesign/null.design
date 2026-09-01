export type Fact = { label: string; value: string };

const FACTS_HEADING = /^##\s+Facts\s*$/;
const H2_HEADING = /^##\s/;
const SEPARATOR_CELL = /^:?-+:?$/;

function countTrailingBackslashes(s: string): number {
  let count = 0;
  for (let i = s.length - 1; i >= 0 && s[i] === "\\"; i -= 1) {
    count += 1;
  }
  return count;
}

function splitUnescapedPipes(s: string): string[] {
  const parts: string[] = [];
  let current = "";
  let backslashes = 0;
  for (const ch of s) {
    if (ch === "\\") {
      backslashes += 1;
      current += ch;
      continue;
    }
    if (ch === "|") {
      if (backslashes % 2 === 0) {
        parts.push(current);
        current = "";
      } else {
        current += ch;
      }
      backslashes = 0;
      continue;
    }
    backslashes = 0;
    current += ch;
  }
  parts.push(current);
  return parts;
}

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && countTrailingBackslashes(s.slice(0, -1)) % 2 === 0) {
    s = s.slice(0, -1);
  }
  return splitUnescapedPipes(s).map((cell) => cell.replace(/\\\|/g, "|").trim());
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => SEPARATOR_CELL.test(cell));
}

export function parseFactsTable(mdx: string): Fact[] | null {
  const lines = mdx.split(/\r?\n/);
  let headingIndex = -1;
  let inFence = false;
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && FACTS_HEADING.test(trimmed)) {
      headingIndex = i;
      break;
    }
  }
  if (headingIndex === -1) return null;

  const body = lines.slice(headingIndex + 1);
  const facts: Fact[] = [];
  let inTable = false;

  for (let i = 0; i < body.length; i += 1) {
    const trimmed = body[i].trim();
    if (H2_HEADING.test(trimmed)) break;
    if (trimmed === "" || !trimmed.includes("|")) {
      if (inTable) break;
      continue;
    }
    if (!inTable) {
      const next = body[i + 1]?.trim() ?? "";
      if (!isSeparatorRow(splitRow(next))) continue;
      inTable = true;
      continue;
    }
    const cells = splitRow(body[i]);
    if (isSeparatorRow(cells)) continue;
    facts.push({ label: cells[0] ?? "", value: cells[1] ?? "" });
  }

  return facts;
}

export function compareFacts(id: string, registry: Fact[], content: Fact[] | null): string[] {
  if (content === null) {
    return [`${id}: content has no ## Facts section to compare against the registry`];
  }

  const problems: string[] = [];
  const contentByLabel = new Map(content.map((fact) => [fact.label, fact.value]));

  for (const fact of registry) {
    const value = contentByLabel.get(fact.label);
    if (value === undefined) {
      problems.push(`${id}: fact "${fact.label}" is missing from the content facts`);
    } else if (value !== fact.value) {
      problems.push(
        `${id}: "${fact.label}" is "${fact.value}" in the registry but "${value}" in the content`,
      );
    }
  }

  const registryLabels = new Set(registry.map((fact) => fact.label));
  for (const fact of content) {
    if (!registryLabels.has(fact.label)) {
      problems.push(`${id}: content fact "${fact.label}" has no registry counterpart`);
    }
  }

  return problems;
}