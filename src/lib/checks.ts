export type Finding = { check: string; line: number; match: string };

type IndexedFinding = Finding & { position: number; order: number };

const OCTET = "(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)";
const IPV4 = `${OCTET}(?:\\.${OCTET}){3}`;

function collectMatches(
  line: string,
  lineNumber: number,
  check: string,
  order: number,
  pattern: RegExp,
  findings: IndexedFinding[],
): void {
  for (const match of line.matchAll(pattern)) {
    if (match.index === undefined) {
      continue;
    }
    findings.push({
      check,
      line: lineNumber,
      match: match[0],
      position: match.index,
      order,
    });
  }
}

function ipv6Matches(line: string): Array<{ match: string; position: number }> {
  const matches: Array<{ match: string; position: number }> = [];
  const pattern = /(?<![A-Za-z0-9:])(?:[0-9A-Fa-f]{0,4}:){2,}[0-9A-Fa-f]{0,4}(?![A-Za-z0-9:])/g;
  for (const match of line.matchAll(pattern)) {
    const value = match[0];
    const groups = value.split(":").filter((group) => group.length > 0).length;
    if (match.index === undefined || groups < 2 || (!value.includes("::") && !/[a-f]/i.test(value))) {
      continue;
    }
    matches.push({ match: value, position: match.index });
  }
  return matches;
}

function collectIpv6(
  line: string,
  lineNumber: number,
  order: number,
  findings: IndexedFinding[],
): void {
  for (const match of ipv6Matches(line)) {
    findings.push({
      check: "ipv6",
      line: lineNumber,
      match: match.match,
      position: match.position,
      order,
    });
  }
}

function collectPorts(
  line: string,
  lineNumber: number,
  order: number,
  findings: IndexedFinding[],
): void {
  const ipv6 = ipv6Matches(line);
  const pattern = new RegExp(
    `(?<![A-Za-z0-9.-])(?:${IPV4}|(?=[A-Za-z0-9.-]*[A-Za-z])(?:[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?)):\\d{2,5}(?![\\d:])`,
    "g",
  );
  for (const match of line.matchAll(pattern)) {
    if (match.index === undefined) {
      continue;
    }
    const end = match.index + match[0].length;
    const overlapsIpv6 = ipv6.some(
      (address) => match.index < address.position + address.match.length && end > address.position,
    );
    if (!overlapsIpv6) {
      findings.push({
        check: "port",
        line: lineNumber,
        match: match[0],
        position: match.index,
        order,
      });
    }
  }
}

function collectEmails(
  line: string,
  lineNumber: number,
  order: number,
  findings: IndexedFinding[],
): void {
  const pattern = /\b[A-Z0-9._%+-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,}\b/gi;
  for (const match of line.matchAll(pattern)) {
    if (match.index === undefined || match[0].toLowerCase() === "studio@null.design") {
      continue;
    }
    findings.push({
      check: "email",
      line: lineNumber,
      match: match[0],
      position: match.index,
      order,
    });
  }
}

function collectEnvironmentAssignment(
  line: string,
  lineNumber: number,
  order: number,
  findings: IndexedFinding[],
): void {
  const match = /^(?:[ \t]*)(?:export[ \t]+)?([A-Z][A-Z0-9_]{2,}=.*)$/.exec(line);
  const assignment = match?.[1];
  if (match === null || assignment === undefined) {
    return;
  }
  findings.push({
    check: "env",
    line: lineNumber,
    match: assignment,
    position: line.indexOf(assignment),
    order,
  });
}

function collectSecrets(
  line: string,
  lineNumber: number,
  order: number,
  findings: IndexedFinding[],
): void {
  const candidates: Array<{ match: string; position: number }> = [];
  const knownPrefix = /(?:ghp_|github_pat_|sk-|AKIA|xox[abp]-)[A-Za-z0-9_.-]*/g;
  for (const match of line.matchAll(knownPrefix)) {
    if (match.index !== undefined) {
      candidates.push({ match: match[0], position: match.index });
    }
  }

  const longToken = /[A-Za-z0-9_.-]{40,}/g;
  for (const match of line.matchAll(longToken)) {
    const value = match[0];
    if (
      match.index !== undefined &&
      /[A-Za-z]/.test(value) &&
      /\d/.test(value) &&
      !/^[0-9a-f]+$/i.test(value)
    ) {
      candidates.push({ match: value, position: match.index });
    }
  }

  candidates.sort((left, right) => left.position - right.position || right.match.length - left.match.length);
  let coveredUntil = -1;
  for (const candidate of candidates) {
    if (candidate.position < coveredUntil) {
      continue;
    }
    findings.push({
      check: "secret",
      line: lineNumber,
      match: candidate.match,
      position: candidate.position,
      order,
    });
    coveredUntil = candidate.position + candidate.match.length;
  }
}

function stripIndexes(findings: IndexedFinding[]): Finding[] {
  findings.sort(
    (left, right) =>
      left.line - right.line || left.position - right.position || left.order - right.order,
  );
  return findings.map(({ check, line, match }) => ({ check, line, match }));
}

export function leakageFindings(text: string): Finding[] {
  const findings: IndexedFinding[] = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    collectMatches(
      line,
      lineNumber,
      "ipv4",
      0,
      new RegExp(`(?<![\\d.])${IPV4}(?![\\d.])`, "g"),
      findings,
    );
    collectIpv6(line, lineNumber, 1, findings);
    collectMatches(
      line,
      lineNumber,
      "hostname",
      2,
      /(?<![A-Za-z0-9-])(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+(?:ts\.net|local|internal|lan)\b/gi,
      findings,
    );
    collectPorts(line, lineNumber, 3, findings);
    collectMatches(
      line,
      lineNumber,
      "path",
      4,
      /(?:\/Users\/|\/home\/)[^\s"'<>]*|[A-Za-z]:\\[^\s"'<>]*/g,
      findings,
    );
    collectEmails(line, lineNumber, 5, findings);
    collectEnvironmentAssignment(line, lineNumber, 6, findings);
    collectSecrets(line, lineNumber, 7, findings);
    collectMatches(
      line,
      lineNumber,
      "attribution",
      8,
      /\bstudent project\b/gi,
      findings,
    );
  });

  return stripIndexes(findings);
}

function collectExclamations(
  line: string,
  lineNumber: number,
  initiallyFenced: boolean,
  findings: IndexedFinding[],
): boolean {
  let fenced = initiallyFenced;
  let position = 0;
  while (position < line.length) {
    if (line.startsWith("```", position)) {
      fenced = !fenced;
      position += 3;
      continue;
    }
    if (
      !fenced &&
      line[position] === "!" &&
      (position + 1 === line.length || /\s/.test(line[position + 1] ?? ""))
    ) {
      findings.push({
        check: "exclamation",
        line: lineNumber,
        match: "!",
        position,
        order: 1,
      });
    }
    position += 1;
  }
  return fenced;
}

export function languageFindings(text: string): Finding[] {
  const findings: IndexedFinding[] = [];
  const bannedPhrase = /\b(?:AI solutions|revolutioni[sz]e|unlock the power|10x|AI transformation|seamless|cutting[- ]edge|leverag(?:e|es|ed|ing)|game[- ]changing|empower(?:s|ed|ing)?)\b/gi;
  let fenced = false;

  text.split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1;
    collectMatches(line, lineNumber, "banned-phrase", 0, bannedPhrase, findings);
    fenced = collectExclamations(line, lineNumber, fenced, findings);
  });

  return stripIndexes(findings);
}
