import type { Metadata } from "next";
import { getRegistry } from "@/lib/registry";
import { Page, PageTitle, Section } from "@/components/site";
import { Flow } from "@/components/registry-views";
import { Stamp } from "@/components/marks";

export const metadata: Metadata = {
  title: "Process",
  description:
    "How Null Design works: what agents do, what humans remain responsible for, how work is verified and how provenance is kept.",
};

const ROLES: Array<[string, string, string]> = [
  ["Scout", "searches sources — repositories, feeds, papers — and emits candidates with provenance", "judge or publish"],
  ["Researcher", "reads, extracts and compares; produces notes with citations", "make claims without sources"],
  ["Builder", "implements against a test or contract, touching only the named files", "edit tests or unrelated files"],
  ["Analyst", "runs data and evaluations; produces tables and figures with method notes", "interpret beyond the data"],
  ["Critic", "adversarial review: fabrication, hype, leakage, provenance", "approve"],
  ["Archivist", "writes run records, updates the registry, stores artifacts", "delete"],
  ["Publisher", "builds, previews, prepares a branch; deploys only after the human gate", "merge unapproved"],
  ["Operator", "routes work between roles, enforces gates, logs", "act externally"],
];

const HUMAN = [
  "strategic direction",
  "publication approval",
  "consequential external actions",
  "client commitments",
  "financial decisions",
  "research claims",
];

export default function ProcessPage() {
  const reg = getRegistry();
  const run = reg.runs.at(-1);

  return (
    <Page>
      <PageTitle
        kicker="Process"
        title="Human-directed agentic orchestration"
        lede={
          <>
            Null Design uses computational agents the way a workshop uses machine tools: with fixtures,
            gauges and a person responsible for the part. This page describes what the agents do, what
            the human keeps, how work is verified and how provenance is maintained. It is not a team of
            artificial employees.
          </>
        }
      />

      <Section number="01" title="What agents do">
        <p className="max-w-[var(--measure)] text-lg leading-relaxed">
          Agents have defined computational roles with a scope, allowed tools and an output type. A
          role is a contract, not a character.
        </p>
        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="meta text-left">
              <th className="border-b border-rule-strong pb-2 pr-4 font-normal">Role</th>
              <th className="border-b border-rule-strong pb-2 pr-4 font-normal">Does</th>
              <th className="border-b border-rule-strong pb-2 font-normal">May not</th>
            </tr>
          </thead>
          <tbody>
            {ROLES.map(([r, d, n]) => (
              <tr key={r} className="align-top">
                <td className="mono border-b border-rule py-2 pr-4">{r}</td>
                <td className="border-b border-rule py-2 pr-4">{d}</td>
                <td className="border-b border-rule py-2 text-ink-2">{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section
        number="02"
        title="What humans keep"
        aside={<p>Gates are policy today and tooling tomorrow. Either way they are recorded.</p>}
      >
        <ul className="grid max-w-[var(--measure)] gap-2 sm:grid-cols-2">
          {HUMAN.map((h, i) => (
            <li key={h} className="flex gap-3 border-t border-rule py-2">
              <span className="mono text-xs text-ink-3">{String(i + 1).padStart(2, "0")}</span>
              {h}
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-[var(--measure)] text-ink-2">
          No agent run deploys, merges, transfers a repository, publishes to{" "}
          <span className="mono">/dev/null</span>, prices a product, or makes a commitment to a client
          or partner. Those actions happen only after a decision is written into the run record.
        </p>
      </Section>

      <Section
        number="03"
        title="Canonical workflow"
        aside={
          <p>
            Two views of one process: stages (left) and roles (<span className="mono">Scout → Researcher → Builder → Critic → human gate → Archivist → Publisher</span>). The human gate sits wherever the consequential action is — before a build that commits resources, or after a preview when the action is publication. Projects may enter or exit at any stage.
          </p>
        }
      >
        <div className="grid gap-10 md:grid-cols-2">
          <Flow
            steps={["RESEARCH", "SCOUT", "ANALYSIS", "CRITIQUE", "HUMAN GATE", "BUILD", "VERIFY", "ARCHIVE", "PUBLISH"]}
            gate="HUMAN GATE"
          />
          <div className="text-sm leading-relaxed text-ink-2">
            <p>
              For building, the lead writes the failing test first. The job — the named files, the
              exports, the behaviour, the gate command — is dispatched to a worker model. Workers today
              include GLM 5.3 Flash via OpenCode, GPT-5.6 via Codex, and a self-hosted Hermes agent
              (a third-party runtime by Nous Research) reached over SSH. The gate decides: typecheck plus
              the named test. A worker&apos;s self-report is never the evidence.
            </p>
            <p className="mt-4">
              For research, Scouts widen and Researchers narrow; a Critic reads for fabrication and
              overreach before anything reaches a human. For publishing, the registry must validate
              before a page can exist.
            </p>
          </div>
        </div>
      </Section>

      <Section number="04" title="How this differs from automation">
        <dl className="grid max-w-[var(--measure)] gap-6">
          <div>
            <dt className="font-medium">Automation executes a fixed procedure.</dt>
            <dd className="text-ink-2">
              Agentic workflows decide how to reach a specified end within a scope — which files to
              read, which sources to trust, when to stop. That discretion is why gates exist.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Automation is verified once.</dt>
            <dd className="text-ink-2">
              Agent output is verified every run, by tests, by a Critic, and by a person, because the
              same prompt does not produce the same work twice.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Automation has logs.</dt>
            <dd className="text-ink-2">
              Runs have provenance: trigger, inputs, tools, roles and models, artifacts, critiques, human
              decisions and the resulting commit or publication.
            </dd>
          </div>
        </dl>
      </Section>

      <Section
        number="05"
        title="Provenance"
        aside={
          <p>
            Run records are registry entries — <span className="mono">RUN-YYYY-NNNN</span> — validated
            like everything else.
          </p>
        }
      >
        {run ? (
          <div className="max-w-[var(--measure)] text-sm">
            <div className="flex items-baseline justify-between border-b border-rule-strong pb-2">
              <span className="font-medium">{run.title}</span>
              <Stamp>{run.id}</Stamp>
            </div>
            <dl>
              {(
                [
                  ["Date", run.date],
                  ["Trigger", run.trigger],
                  ["Human director", run.human_director],
                  ["Status", run.status],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-3 border-t border-rule py-2">
                  <dt className="meta">{k}</dt>
                  <dd className="col-span-2">{v}</dd>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3 border-t border-rule py-2">
                <dt className="meta">Roles</dt>
                <dd className="col-span-2">
                  <ul className="space-y-1">
                    {run.roles.map((r) => (
                      <li key={`${r.role}-${r.agent}`}>
                        <span className="mono">{r.role}</span> — {r.agent}
                        <span className="text-ink-2"> · {r.scope}</span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-rule py-2">
                <dt className="meta">Tools</dt>
                <dd className="mono col-span-2 text-xs">{run.tools.join(" · ")}</dd>
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-rule py-2">
                <dt className="meta">Artifacts</dt>
                <dd className="col-span-2">
                  <ul className="mono space-y-1 text-xs">
                    {run.artifacts.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-rule py-2">
                <dt className="meta">Human decisions</dt>
                <dd className="col-span-2">
                  <ul className="space-y-1">
                    {run.human_decisions.map((d) => (
                      <li key={d.decision} className="flex items-baseline justify-between gap-4">
                        <span>{d.decision}</span>
                        <span className="meta shrink-0">{d.outcome}</span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-b border-rule py-2">
                <dt className="meta">Result</dt>
                <dd className="mono col-span-2 text-xs">
                  commit {run.result.commit ?? "[ ]"} · publication {run.result.publication ?? "[ ]"}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="placeholder">No run records yet.</div>
        )}
      </Section>

      <Section number="06" title="Publishing">
        <p className="max-w-[var(--measure)] text-ink-2">
          The content system is built so that a single command can eventually carry a catalogue entry
          from registry to page — with the human gate intact.
        </p>
        <pre className="mono mt-6 max-w-[var(--measure)] overflow-x-auto border border-rule bg-paper-2 p-4 text-xs leading-relaxed">
{`null publish ND-004

validate registry → inspect repository → collect artifacts
→ draft case study → verify provenance → generate metadata
→ run critique → create branch → build → preview
→ HUMAN APPROVAL → merge → deploy → archive run`}
        </pre>
        <p className="mt-6 text-sm text-ink-2">
          Conventions for agents working in the site repository are written down in its{" "}
          <span className="mono">AGENTS.md</span>; the repository will be public once the studio&apos;s organisation account is revived.</p>
      </Section>
    </Page>
  );
}
