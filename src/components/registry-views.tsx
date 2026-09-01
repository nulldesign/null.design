import Link from "next/link";
import type { Program, Project } from "@registry/schema";
import { Stamp } from "./marks";

export function StatusDot({ status }: { status: string }) {
  const label = status.toUpperCase();
  return (
    <span className="meta inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className={`inline-block h-1.5 w-1.5 ${
          status === "active" ? "bg-accent" : status === "planned" ? "border border-ink-3" : "bg-ink-3"
        }`}
      />
      {label}
    </span>
  );
}

/** A project has a public page only when the registry says so and the narrative exists. */
export function isPublished(p: Project, hasDoc: boolean) {
  return p.visibility !== "private" && p.publication.case_study && hasDoc;
}

const cell = "border-b border-rule py-4 pr-4 align-top md:py-5";

/** Catalogue row — a real table row, with headers supplied by the caller. */
export function ProjectRow({ p, href }: { p: Project; href: string | null }) {
  return (
    <tr>
      <th scope="row" className={`${cell} mono w-[5.5rem] text-left text-sm font-normal text-ink-2`}>
        {p.id}
      </th>
      <td className={`${cell} font-medium`}>
        {href ? (
          <Link href={href} className="link-quiet">
            {p.title}
          </Link>
        ) : (
          p.title
        )}
        {p.visibility === "internal" && <span className="meta ml-2 font-normal">architecture only</span>}
        <p className="mt-1 text-sm font-normal leading-snug text-ink-2 md:hidden">{p.summary}</p>
      </td>
      <td className={`${cell} hidden text-sm leading-snug text-ink-2 md:table-cell`}>{p.summary}</td>
      <td className={`${cell} meta hidden md:table-cell`}>{p.classification.practice.slice(0, 2).join(" · ")}</td>
      <td className={`${cell} whitespace-nowrap pr-0`}>
        <StatusDot status={p.status} />
      </td>
    </tr>
  );
}

export function CatalogueTable({
  caption,
  rows,
}: {
  caption: string;
  rows: Array<{ p: Project; href: string | null }>;
}) {
  return (
    <table className="w-full border-collapse">
      <caption className="meta border-b border-rule-strong pb-2 text-left">{caption}</caption>
      <thead>
        <tr className="meta text-left">
          <th scope="col" className="border-b border-rule-strong py-2 pr-4 font-normal">ID</th>
          <th scope="col" className="border-b border-rule-strong py-2 pr-4 font-normal">Title</th>
          <th scope="col" className="hidden border-b border-rule-strong py-2 pr-4 font-normal md:table-cell">Summary</th>
          <th scope="col" className="hidden border-b border-rule-strong py-2 pr-4 font-normal md:table-cell">Practice</th>
          <th scope="col" className="border-b border-rule-strong py-2 font-normal">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ p, href }) => (
          <ProjectRow key={p.id} p={p} href={href} />
        ))}
      </tbody>
    </table>
  );
}

export function ProjectCard({ p, href }: { p: Project; href: string | null }) {
  const inner = (
    <>
      <div className="flex items-baseline justify-between">
        <span className="mono text-sm text-ink-2">{p.id}</span>
        <StatusDot status={p.status} />
      </div>
      <h3 className="mt-3 text-xl font-medium tracking-[-0.01em]">{p.title}</h3>
      <p className="mt-2 text-sm leading-snug text-ink-2">{p.summary}</p>
      {p.facts.length > 0 && (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1">
          {p.facts.slice(0, 4).map((f) => (
            <div key={f.label} className="contents">
              <dt className="meta">{f.label}</dt>
              <dd className="mono text-xs">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </>
  );
  const cls = "block border-t border-rule-strong pt-4 h-full";
  return href ? (
    <Link href={href} className={`${cls} hover:text-accent`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function ProgramCard({ pr, href }: { pr: Program; href: string }) {
  return (
    <Link href={href} className="block border-t border-rule-strong pt-4 hover:text-accent">
      <span className="mono text-sm text-ink-2">{pr.id}</span>
      <h3 className="mt-3 text-xl font-medium tracking-[-0.01em]">{pr.title}</h3>
      <p className="mt-2 text-sm leading-snug text-ink-2">{pr.summary}</p>
      {pr.workflow.length > 0 && (
        <p className="mono mt-4 text-xs text-ink-2">{pr.workflow.join(" → ")}</p>
      )}
    </Link>
  );
}

/** Specification block shown beside a case study. */
export function ProjectSpec({ p }: { p: Project }) {
  const years =
    p.year.ended === null
      ? `${p.year.started}–`
      : p.year.ended === p.year.started
        ? `${p.year.started}`
        : `${p.year.started}–${p.year.ended}`;
  const rows: Array<[string, React.ReactNode]> = [
    ["ID", <span key="id" className="mono">{p.id}</span>],
    ["Status", <StatusDot key="s" status={p.status} />],
    ["Years", <span key="y" className="mono">{years}</span>],
    ["Classification", p.classification.type.join(" · ")],
    ["Practice", p.classification.practice.join(", ")],
    ["Programs", p.research_programs.length ? p.research_programs.join(", ") : "—"],
    ["Agent roles", p.agents.length ? p.agents.join(", ") : "—"],
    ["Ownership", p.provenance.ownership + (p.provenance.review_required ? " · under review" : "")],
    ["AI co-authored", p.provenance.ai_coauthored ? "yes" : "no"],
    ["Third-party", p.provenance.third_party.length ? p.provenance.third_party.join(", ") : "—"],
    ["Commissionable", p.commercial.commissionable ? "yes" : "no"],
  ];
  // Repository links are shown only for public repositories of records that are not under review.
  const linkable = !p.provenance.review_required;
  return (
    <dl className="text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-3 gap-3 border-t border-rule py-2">
          <dt className="meta">{k}</dt>
          <dd className="col-span-2">{v}</dd>
        </div>
      ))}
      {p.repositories.length > 0 && (
        <div className="grid grid-cols-3 gap-3 border-t border-rule py-2">
          <dt className="meta">Repositories</dt>
          <dd className="col-span-2 space-y-1">
            {p.repositories.map((r) => (
              <div key={r.url}>
                {r.visibility === "public" && linkable ? (
                  <a className="link mono text-xs break-all" href={r.url} rel="noopener">
                    {r.url.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  <span className="mono text-xs text-ink-2">
                    {r.visibility === "public" ? "link withheld pending review" : "private repository"}
                  </span>
                )}
                <span className="meta ml-2">{r.role}</span>
              </div>
            ))}
          </dd>
        </div>
      )}
      {p.publication.public_url && linkable && (
        <div className="grid grid-cols-3 gap-3 border-t border-rule py-2">
          <dt className="meta">Public</dt>
          <dd className="col-span-2">
            <a className="link mono text-xs break-all" href={p.publication.public_url} rel="noopener">
              {p.publication.public_url.replace(/^https?:\/\//, "")}
            </a>
          </dd>
        </div>
      )}
      {p.human_gates.length > 0 && (
        <div className="grid grid-cols-3 gap-3 border-t border-rule py-2">
          <dt className="meta">Human gates</dt>
          <dd className="col-span-2">
            <ul className="space-y-1">
              {p.human_gates.map((g) => (
                <li key={g}>— {g}</li>
              ))}
            </ul>
          </dd>
        </div>
      )}
      <div className="border-t border-rule py-2">
        <Stamp>registry/projects/{p.id}.yaml</Stamp>
      </div>
    </dl>
  );
}

/** A vertical flow, rendered as an ordered list so it reads without CSS. */
export function Flow({ steps, gate }: { steps: string[]; gate?: string }) {
  return (
    <ol className="mono text-sm">
      {steps.map((s, i) => {
        const isGate = gate !== undefined && s === gate;
        return (
          <li key={s} className="flex flex-col">
            <span
              className={
                isGate
                  ? "inline-block w-fit border border-rule-strong px-2 py-0.5 font-medium"
                  : "inline-block w-fit px-2 py-0.5"
              }
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <span aria-hidden className="px-2 leading-none text-ink-3">
                ↓
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
