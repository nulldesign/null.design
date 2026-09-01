import { describe, expect, it } from "vitest";
import { parseId, isValidId, nextId, compareIds, formatRunId } from "./ids";

describe("parseId", () => {
  it("parses general work ids", () => {
    expect(parseId("ND-002")).toEqual({ kind: "project", number: 2, raw: "ND-002" });
  });
  it("parses program ids", () => {
    expect(parseId("ND-R01")).toEqual({ kind: "program", number: 1, raw: "ND-R01" });
  });
  it("parses experiment ids", () => {
    expect(parseId("AE-013")).toEqual({ kind: "experiment", number: 13, raw: "AE-013" });
  });
  it("parses product ids", () => {
    expect(parseId("ND-P04")).toEqual({ kind: "product", number: 4, raw: "ND-P04" });
  });
  it("parses run ids with a year", () => {
    expect(parseId("RUN-2026-0001")).toEqual({
      kind: "run",
      number: 1,
      year: 2026,
      raw: "RUN-2026-0001",
    });
  });
  it("returns null for anything else", () => {
    expect(parseId("nd-002")).toBeNull();
    expect(parseId("ND-2")).toBeNull();
    expect(parseId("ND-0002")).toBeNull();
    expect(parseId("RUN-26-0001")).toBeNull();
    expect(parseId("")).toBeNull();
  });
});

describe("isValidId", () => {
  it("accepts every kind", () => {
    for (const id of ["ND-001", "ND-R01", "AE-001", "ND-P01", "RUN-2026-0001"]) {
      expect(isValidId(id)).toBe(true);
    }
  });
  it("optionally constrains the kind", () => {
    expect(isValidId("ND-001", "project")).toBe(true);
    expect(isValidId("ND-001", "program")).toBe(false);
  });
});

describe("nextId", () => {
  it("returns the first id of a kind when none exist", () => {
    expect(nextId("project", [])).toBe("ND-001");
    expect(nextId("program", [])).toBe("ND-R01");
    expect(nextId("experiment", [])).toBe("AE-001");
    expect(nextId("product", [])).toBe("ND-P01");
  });
  it("increments past the highest existing id of that kind, ignoring other kinds", () => {
    expect(nextId("project", ["ND-003", "ND-R05", "ND-001"])).toBe("ND-004");
    expect(nextId("program", ["ND-003", "ND-R05"])).toBe("ND-R06");
  });
  it("scopes run ids to a year", () => {
    expect(nextId("run", ["RUN-2025-0042", "RUN-2026-0002"], 2026)).toBe("RUN-2026-0003");
    expect(nextId("run", ["RUN-2025-0042"], 2026)).toBe("RUN-2026-0001");
  });
  it("throws when a run id is requested without a year", () => {
    expect(() => nextId("run", [])).toThrow();
  });
});

describe("formatRunId", () => {
  it("zero-pads to four digits", () => {
    expect(formatRunId(2026, 7)).toBe("RUN-2026-0007");
  });
});

describe("compareIds", () => {
  it("sorts by kind order project < program < experiment < product < run, then number", () => {
    const ids = ["ND-P01", "RUN-2026-0001", "ND-R01", "AE-002", "ND-010", "ND-002", "AE-001"];
    expect([...ids].sort(compareIds)).toEqual([
      "ND-002",
      "ND-010",
      "ND-R01",
      "AE-001",
      "AE-002",
      "ND-P01",
      "RUN-2026-0001",
    ]);
  });
  it("sorts runs by year then number", () => {
    expect(["RUN-2026-0001", "RUN-2025-0009"].sort(compareIds)).toEqual([
      "RUN-2025-0009",
      "RUN-2026-0001",
    ]);
  });
});
