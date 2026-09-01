import { describe, expect, it } from "vitest";
import { languageFindings, leakageFindings, type Finding } from "./checks";

// Fixtures use documentation ranges and example domains only (RFC 5737, RFC 3849, RFC 2606).

describe("leakageFindings", () => {
  it("returns no findings for clean copy", () => {
    const text = [
      "Runs on an always-on Mac. Contact studio@null.design.",
      "Built with Next.js 16.0.1 and React 19; see https://github.com/nulldesign/null.design.",
      "Contrast ratio 4.5:1, aspect 16:9, meeting at 12:30, Node 24: install it.",
      "Commit 19390e6 on 2026-09-01.",
    ].join("\n");
    expect(leakageFindings(text)).toEqual([]);
  });

  it("flags IPv4 literals with a 1-based line number and the matched text", () => {
    const out = leakageFindings("line one\nhost is 192.0.2.10 today");
    expect(out).toEqual<Finding[]>([{ check: "ipv4", line: 2, match: "192.0.2.10" }]);
  });

  it("does not treat a three-part version string as an IPv4 literal", () => {
    expect(leakageFindings("Next.js 16.0.1 and 1.2.3")).toEqual([]);
  });

  it("flags IPv6 literals but not clock times", () => {
    const out = leakageFindings("addr 2001:db8::1 and 2001:db8:85a3:0:0:8a2e:370:7334\nat 12:30:45");
    expect(out.map((f) => [f.check, f.line])).toEqual([
      ["ipv6", 1],
      ["ipv6", 1],
    ]);
  });

  it("does not flag CSS pseudo-elements or a lone double colon as IPv6", () => {
    expect(leakageFindings(".rule::before { content: '' } ::after and std::vector")).toEqual([]);
  });

  it("flags tailnet and internal hostnames", () => {
    const out = leakageFindings("ssh box.tail0000.ts.net\nhttp://studio-mini.local/x\ndb.internal and files.lan");
    expect(out.map((f) => [f.check, f.line, f.match])).toEqual([
      ["hostname", 1, "box.tail0000.ts.net"],
      ["hostname", 2, "studio-mini.local"],
      ["hostname", 3, "db.internal"],
      ["hostname", 3, "files.lan"],
    ]);
  });

  it("flags host:port pairs but not ratios, times or counts", () => {
    const out = leakageFindings("localhost:3000 and 192.0.2.10:8443\nratio 16:9 at 12:30 with 300 people");
    expect(out.filter((f) => f.line === 2)).toEqual([]);
    expect(out.filter((f) => f.check === "port").map((f) => f.match)).toEqual(["localhost:3000", "192.0.2.10:8443"]);
    expect(out.filter((f) => f.check === "ipv4").map((f) => f.match)).toEqual(["192.0.2.10"]);
  });

  it("flags local filesystem paths", () => {
    const out = leakageFindings("see /Users/someone/Developer/x\nand /home/someone/y\nand C:\\Users\\someone\\z");
    expect(out.map((f) => [f.check, f.line])).toEqual([
      ["path", 1],
      ["path", 2],
      ["path", 3],
    ]);
  });

  it("flags e-mail addresses other than studio@null.design", () => {
    const out = leakageFindings("write to studio@null.design or someone@example.com");
    expect(out).toEqual<Finding[]>([{ check: "email", line: 1, match: "someone@example.com" }]);
  });

  it("flags environment variables with values at line start, not names alone", () => {
    const text = "set OPENROUTER_API_KEY in your shell\nOPENROUTER_API_KEY=abc123\n  export HERMES_HOST=user@host";
    expect(leakageFindings(text).map((f) => [f.check, f.line])).toEqual([
      ["env", 2],
      ["env", 3],
    ]);
  });

  it("flags known secret prefixes and long high-entropy tokens, but not commit hashes", () => {
    const text = [
      "token ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef123456",
      "key sk-abcdefghijklmnopqrstuvwxyz0123456789ABCD",
      "aws AKIAIOSFODNN7EXAMPLE",
      "sha 3f2a9c1e",
      "full 3f2a9c1e3f2a9c1e3f2a9c1e3f2a9c1e3f2a9c1e",
      "blob eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.Xk7QpZ2mN8vB4cR6tY1wA3sD5fG9hJ",
    ].join("\n");
    expect(leakageFindings(text).map((f) => [f.check, f.line])).toEqual([
      ["secret", 1],
      ["secret", 2],
      ["secret", 3],
      ["secret", 6],
    ]);
  });

  it("flags 'student project' attributions", () => {
    expect(leakageFindings("Built as a Student Project in 2024").map((f) => f.check)).toEqual(["attribution"]);
  });

  it("scans fenced code blocks as well as prose", () => {
    expect(leakageFindings("```sh\ncd /Users/someone/x\n```").map((f) => f.line)).toEqual([2]);
  });

  it("handles CRLF line endings", () => {
    expect(leakageFindings("a\r\nb 192.0.2.1\r\nc").map((f) => f.line)).toEqual([2]);
  });
});

describe("languageFindings", () => {
  it("returns no findings for plain copy", () => {
    expect(languageFindings("Null Design explores how computation can expand human agency.\nAgents are computational roles.")).toEqual([]);
  });

  it("flags each banned phrase case-insensitively with its line", () => {
    const text = [
      "We offer AI solutions.",
      "It will Revolutionize teaching.",
      "Unlock the power of agents.",
      "A 10x gain.",
      "AI transformation for schools.",
      "A seamless workflow.",
      "Cutting-edge models and cutting edge tools.",
      "We leverage models; leveraging is leveraged.",
      "A game-changing kit.",
      "Tools that empower teachers.",
    ].join("\n");
    const out = languageFindings(text);
    expect(out.every((f) => f.check === "banned-phrase")).toBe(true);
    expect([...new Set(out.map((f) => f.line))]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("does not flag a word that merely contains a banned phrase", () => {
    expect(languageFindings("clever, empowerment-free, unlocked.")).toEqual([]);
  });

  it("flags exclamation marks in body copy but not inside fences, != or !important", () => {
    const text = "Great!\n```\nif (a != b) alert('x!')\n```\nStyle: color: red !important\nDone!";
    expect(languageFindings(text).map((f) => [f.check, f.line])).toEqual([
      ["exclamation", 1],
      ["exclamation", 6],
    ]);
  });

  it("reports the match text and check name", () => {
    expect(languageFindings("truly seamless")).toEqual<Finding[]>([{ check: "banned-phrase", line: 1, match: "seamless" }]);
  });
});
