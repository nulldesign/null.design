import { describe, expect, it } from "vitest";
import { compareFacts, factsTableProblems, parseFactsTable, type Fact } from "./facts";

const doc = `---
id: ND-002
slug: qlass
title: Qlass
---

## System

Prose with a | pipe in it.

## Facts

| Label | Value |
|---|---|
| licence | MIT |
| data models | 28 (Prisma) |
| agent pipeline | plan → author → review → teacher publish |

Trailing paragraph after the table.

## Sources

| Not | Facts |
|---|---|
| x | y |
`;

describe("parseFactsTable", () => {
  it("parses label/value rows from the table under ## Facts, skipping header and separator", () => {
    expect(parseFactsTable(doc)).toEqual<Fact[]>([
      { label: "licence", value: "MIT" },
      { label: "data models", value: "28 (Prisma)" },
      { label: "agent pipeline", value: "plan → author → review → teacher publish" },
    ]);
  });

  it("returns null when the document has no ## Facts heading", () => {
    expect(parseFactsTable("## System\n\n| a | b |\n|---|---|\n| 1 | 2 |\n")).toBeNull();
  });

  it("returns an empty list when the heading exists but no table follows before the next heading", () => {
    expect(parseFactsTable("## Facts\n\nNothing yet.\n\n## Next\n\n| a | b |\n|---|---|\n| 1 | 2 |\n")).toEqual([]);
  });

  it("trims cell whitespace and tolerates rows without a leading or trailing pipe", () => {
    const src = "## Facts\n\n|  Label  |  Value  |\n| --- | --- |\n  modules   |   11  \n| deployed | GitHub Pages |\n";
    expect(parseFactsTable(src)).toEqual([
      { label: "modules", value: "11" },
      { label: "deployed", value: "GitHub Pages" },
    ]);
  });
});

describe("compareFacts", () => {
  const registry: Fact[] = [
    { label: "licence", value: "MIT" },
    { label: "modules", value: "11" },
  ];

  it("returns no problems when content facts match the registry regardless of order", () => {
    expect(compareFacts("ND-005", registry, [registry[1], registry[0]])).toEqual([]);
  });

  it("reports a fact whose value differs, naming the id, label and both values", () => {
    const problems = compareFacts("ND-005", registry, [
      { label: "licence", value: "MIT" },
      { label: "modules", value: "12" },
    ]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("ND-005");
    expect(problems[0]).toContain('"modules"');
    expect(problems[0]).toContain("11");
    expect(problems[0]).toContain("12");
  });

  it("reports facts missing from content and facts in content with no registry counterpart", () => {
    const problems = compareFacts("ND-005", registry, [
      { label: "licence", value: "MIT" },
      { label: "deployed", value: "GitHub Pages" },
    ]);
    expect(problems).toHaveLength(2);
    expect(problems.some((p) => p.includes('"modules"') && p.includes("missing"))).toBe(true);
    expect(problems.some((p) => p.includes('"deployed"') && p.includes("registry"))).toBe(true);
  });

  it("reports a single problem mentioning ## Facts when the content has no facts section", () => {
    const problems = compareFacts("ND-005", registry, null);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("ND-005");
    expect(problems[0]).toContain("## Facts");
  });

  it("returns no problems when both sides are empty", () => {
    expect(compareFacts("ND-013", [], [])).toEqual([]);
  });
});

describe("parseFactsTable — edge cases", () => {
  it("skips prose containing a pipe before the table and still parses the table", () => {
    const src = "## Facts\n\nA sentence with a | pipe in it.\n\n| Label | Value |\n|---|---|\n| modules | 11 |\n";
    expect(parseFactsTable(src)).toEqual([{ label: "modules", value: "11" }]);
  });

  it("treats an escaped pipe inside a cell as a literal pipe", () => {
    const src = "## Facts\n\n| Label | Value |\n|---|---|\n| range | 5 \\| 95 |\n";
    expect(parseFactsTable(src)).toEqual([{ label: "range", value: "5 | 95" }]);
  });

  it("ignores a ## Facts line inside a fenced code block", () => {
    const src = "## System\n\n```\n## Facts\n| a | b |\n|---|---|\n| 1 | 2 |\n```\n\n## Facts\n\n| Label | Value |\n|---|---|\n| modules | 11 |\n";
    expect(parseFactsTable(src)).toEqual([{ label: "modules", value: "11" }]);
  });

  it("handles CRLF line endings", () => {
    const src = "## Facts\r\n\r\n| Label | Value |\r\n|---|---|\r\n| modules | 11 |\r\n";
    expect(parseFactsTable(src)).toEqual([{ label: "modules", value: "11" }]);
  });
});

describe("factsTableProblems", () => {
  const bad = `## Facts

| Label | Value |
|---|---|
| licence | MIT |
| stray | a | b |
| lonely |

## Next
`;

  it("returns no problems when every data row has exactly two cells", () => {
    expect(factsTableProblems("ND-002", doc)).toEqual([]);
  });

  it("returns no problems when there is no ## Facts section or no table", () => {
    expect(factsTableProblems("ND-002", "# Nothing here")).toEqual([]);
    expect(factsTableProblems("ND-002", "## Facts\n\nNo table.\n\n## Next")).toEqual([]);
  });

  it("reports each data row whose cell count is not two, numbered from 1 after the separator", () => {
    expect(factsTableProblems("ND-002", bad)).toEqual([
      "ND-002: facts row 2 has 3 cells, expected 2: | stray | a | b |",
      "ND-002: facts row 3 has 1 cell, expected 2: | lonely |",
    ]);
  });

  it("does not count an escaped pipe as a cell boundary", () => {
    const ok = "## Facts\n\n| L | V |\n|---|---|\n| pipe | a \\| b |\n";
    expect(factsTableProblems("ND-002", ok)).toEqual([]);
  });

  it("leaves parseFactsTable tolerant of malformed rows", () => {
    expect(parseFactsTable(bad)).toEqual<Fact[]>([
      { label: "licence", value: "MIT" },
      { label: "stray", value: "a" },
      { label: "lonely", value: "" },
    ]);
  });
});
