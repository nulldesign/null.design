import type { Metadata } from "next";
import Link from "next/link";
import { getRegistry } from "@/lib/registry";
import { Page, PageTitle, Section } from "@/components/site";
import { NulMark } from "@/components/marks";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Null Design is available for selected commissions, collaborations and research partnerships.",
};

const CATEGORIES = [
  ["agentic systems", "workflows with defined roles, gates and provenance; worker fleets; evaluation harnesses"],
  ["research tooling", "pipelines that search, filter, synthesise and publish; knowledge bases as agent memory"],
  ["educational systems", "learning environments, gated generative tools for teachers, audit and reconciliation agents"],
  ["computational curriculum", "units and exemplars where computation changes what learners can investigate"],
  ["internal software", "small, durable tools that replace spreadsheets and rituals"],
  ["data applications", "analysis, forecasting, dashboards with method notes"],
  ["prototypes", "working systems that answer a question before a budget is committed"],
  ["automation infrastructure", "scheduled runs, approval loops, self-hosted services"],
] as const;

export default function StudioPage() {
  const reg = getRegistry();
  const products = reg.products.filter((p) => p.visibility === "public");

  return (
    <Page>
      <PageTitle
        kicker="Studio"
        title="Selected commissions, collaborations and research partnerships"
        lede="Null Design is a small computational institution: a research practice, a studio and a developer of reusable tools. It takes on a limited amount of commissioned work where the problem is real, the collaborators are serious and the result can inform the research."
      />

      <Section number="01" title="Three modes" aside={<p>Projects may move between modes at any stage.</p>}>
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-medium">Research</h3>
            <p className="mt-2 text-sm text-ink-2">
              Ideas, essays, experiments, methods, open research; Agentic Education. Builds intellectual
              capital and reputation.
            </p>
          </div>
          <div>
            <h3 className="font-medium">Studio</h3>
            <p className="mt-2 text-sm text-ink-2">
              Commissioned intelligent systems, agent workflows, research infrastructure, educational
              technology, internal tools, data systems, prototypes, computational interfaces.
            </p>
          </div>
          <div>
            <h3 className="font-medium">Products</h3>
            <p className="mt-2 text-sm text-ink-2">
              Repeatable outputs that become software, kits, licences, subscriptions, workflow packages,
              frameworks and briefings. Not every experiment becomes a product.
            </p>
          </div>
        </div>
        <pre className="mono mt-10 overflow-x-auto text-xs leading-relaxed text-ink-2">
{`RESEARCH → EXPERIMENT → WORKING SYSTEM → CASE STUDY → COMMISSION → REUSABLE PATTERN → PRODUCT → FUNDS NEW RESEARCH`}
        </pre>
      </Section>

      <Section number="02" title="Commission categories">
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {CATEGORIES.map(([k, v]) => (
            <div key={k} className="border-t border-rule pt-2">
              <dt className="font-medium">{k}</dt>
              <dd className="text-sm text-ink-2">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 max-w-[var(--measure)] text-ink-2">
          How we work is documented on the{" "}
          <Link href="/process" className="link">
            Process
          </Link>{" "}
          page: agents do bounded work under tests and critique; a human holds direction, approvals,
          commitments and claims.
        </p>
      </Section>

      <Section
        number="03"
        title="Products in evaluation"
        aside={<p>Nothing here is for sale yet. Each candidate lists what must be true before launch.</p>}
      >
        <ul className="grid gap-8 md:grid-cols-2">
          {products.map((p) => (
            <li key={p.id} className="border-t border-rule-strong pt-3">
              <div className="flex items-baseline justify-between">
                <span className="mono text-sm text-ink-2">
                  {p.id} · {p.code}
                </span>
                <span className="meta">{p.status}</span>
              </div>
              <h3 className="mt-2 text-lg font-medium">{p.title}</h3>
              <p className="mt-2 text-sm text-ink-2">{p.summary}</p>
              <p className="meta mt-3">launch requires</p>
              <ul className="mt-1 text-sm text-ink-2">
                {p.launch_requires.map((r) => (
                  <li key={r}>— {r}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Section>

      <Section number="04" title="Contact">
        <div className="flex items-start gap-8">
          <NulMark size={48} />
          <div>
            <p className="text-lg">
              <a className="link" href="mailto:studio@null.design">
                studio@null.design
              </a>
            </p>
            <p className="mt-2 max-w-[var(--measure)] text-sm text-ink-2">
              Write with the problem, the people involved and what a good result would let you do.
            </p>
          </div>
        </div>
      </Section>
    </Page>
  );
}
