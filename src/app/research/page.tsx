import type { Metadata } from "next";
import Link from "next/link";
import { getRegistry } from "@/lib/registry";
import { Page, PageTitle, Section } from "@/components/site";
import { StatusDot } from "@/components/registry-views";

export const metadata: Metadata = {
  title: "Research",
  description: "Null Design research programs and experiments.",
};

export default function ResearchIndex() {
  const reg = getRegistry();
  const programs = reg.programs.filter((p) => p.visibility === "public");

  return (
    <Page>
      <PageTitle
        kicker={`Research — ${programs.length} programs`}
        title="Research"
        lede="Research produces ideas, essays, experiments, methods and open work. It builds the intellectual capital the studio and its products draw on. Programs are numbered ND-R; experiments inside Agentic Education are numbered AE."
      />
      {programs.map((pr, i) => (
        <Section key={pr.id} number={String(i + 1).padStart(2, "0")} title={pr.title} aside={<span className="mono">{pr.id}</span>}>
          <p className="max-w-[var(--measure)] text-lg leading-relaxed">{pr.summary}</p>
          {pr.principle && (
            <p className="mt-6 max-w-[var(--measure)] border-l border-rule-strong pl-5 text-ink-2">{pr.principle}</p>
          )}
          {pr.workflow.length > 0 && <p className="mono mt-6 text-sm">{pr.workflow.join(" → ")}</p>}
          {pr.experiments.length > 0 && (
            <table className="mt-8 w-full text-sm">
              <thead>
                <tr className="meta text-left">
                  <th className="border-b border-rule-strong pb-2 pr-4 font-normal">Experiment</th>
                  <th className="border-b border-rule-strong pb-2 pr-4 font-normal">Title</th>
                  <th className="border-b border-rule-strong pb-2 pr-4 font-normal">Project</th>
                  <th className="border-b border-rule-strong pb-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {pr.experiments.map((e) => (
                  <tr key={e.id}>
                    <td className="mono border-b border-rule py-2 pr-4">{e.id}</td>
                    <td className="border-b border-rule py-2 pr-4">{e.title}</td>
                    <td className="mono border-b border-rule py-2 pr-4">{e.project ?? "—"}</td>
                    <td className="border-b border-rule py-2">
                      <StatusDot status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-8">
            <Link href={`/research/${pr.slug}`} className="link">
              {pr.id} in full →
            </Link>
          </p>
        </Section>
      ))}
    </Page>
  );
}
