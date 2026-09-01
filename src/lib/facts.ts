export type Fact = { label: string; value: string };

const FACTS_HEADING = /^##\s+Facts\s*$/;
const H2_HEADING = /^##\s/;
const SEPARATOR_CELL = /^:?-+:?$/;

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((cell) => cell.trim());
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => SEPARATOR_CELL.test(cell));
}

export function parseFactsTable(mdx: string): Fact[] | null {
  const lines = mdx.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => FACTS_HEADING.test(line.trim()));
  if (headingIndex === -1) return null;

  const facts: Fact[] = [];
  let inTable = false;

  for (const line of lines.slice(headingIndex + 1)) {
    if (H2_HEADING.test(line.trim())) break;
    const trimmed = line.trim();
    if (trimmed === "" || !trimmed.includes("|")) {
      if (inTable) break;
      continue;
    }
    const cells = splitRow(line);
    if (!inTable) {
      inTable = true;
      continue;
    }
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
