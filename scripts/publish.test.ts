import { describe, expect, it } from "vitest";
import { findingsFor, parseArgs } from "./publish";

describe("parseArgs", () => {
  it("parses an ID with an optional dry-run flag", () => {
    expect(parseArgs(["ND-006"])).toEqual({ id: "ND-006", dryRun: false });
    expect(parseArgs(["ND-006", "--dry-run"])).toEqual({ id: "ND-006", dryRun: true });
    expect(parseArgs(["--dry-run", "ND-R01"])).toEqual({ id: "ND-R01", dryRun: true });
  });

  it("rejects a missing ID, unknown flags, duplicate flags, and extra IDs", () => {
    expect(parseArgs([])).toHaveProperty("error");
    expect(parseArgs(["--unknown", "ND-006"])).toEqual({ error: "Unknown flag: --unknown" });
    expect(parseArgs(["ND-006", "--dry-run", "--dry-run"])).toHaveProperty("error");
    expect(parseArgs(["ND-006", "ND-007"])).toHaveProperty("error");
  });
});

describe("findingsFor", () => {
  it("formats leakage findings for every file and language findings only when enabled", () => {
    const findings = findingsFor([
      {
        path: "content/work/example.mdx",
        text: "A seamless student project.",
        language: true,
      },
      {
        path: "registry/projects/ND-999.yaml",
        text: "summary: A seamless student project.",
        language: false,
      },
    ]);

    expect(findings).toEqual([
      "content/work/example.mdx:1 [attribution] student project",
      "content/work/example.mdx:1 [banned-phrase] seamless",
      "registry/projects/ND-999.yaml:1 [attribution] student project",
    ]);
  });

  it("returns no lines for clean text", () => {
    expect(
      findingsFor([{ path: "content/work/example.mdx", text: "Plain copy.", language: true }]),
    ).toEqual([]);
  });
});
