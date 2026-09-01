import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRegistry } from "@/lib/registry";
import { compileContent, hasContent } from "@/lib/content";
import { Page } from "@/components/site";
import { Flow, StatusDot, isPublished } from "@/components/registry-views";
import { Stamp } from "@/components/marks";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getRegistry()
    .programs.filter((p) => p.visibility === "public")
    .map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const pr = getRegistry().programBySlug.get(slug);
  if (!pr) return {};
  return { title: `${pr.title} (${pr.id})`, description: pr.summary };
}

export default async function ProgramPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const reg = getRegistry();
  const pr = reg.programBySlug.get(slug);
  if (!pr || pr.visibility !== "public") notFound();
  const doc = await compileContent("research", slug);
  const projects = pr.projects
    .map((id) => reg.projects.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined && p.visibility !== "private");

  return (
    <Page>
      <article>
        <header className="grid gap-8 py-12 md:grid-cols-12 md:py-16">
          <div className="md:col-span-8">
            <p className="meta">
              <Link href="/research" className="link-quiet">
                Research
              </Link>{" "}
              / <span className="mono normal-case">{pr.id}</span>
            </p>
            <h1 className="mt-3 text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.025em]">
              {pr.title}
            </h1>
            <p className="mt-5 max-w-[var(--measure)] text-xl leading-snug text-ink-2">
              {doc?.frontmatter.deck ?? pr.summary}
            </p>
          </div>
          <div className="md:col-span-4 md:justify-self-end">
            <StatusDot status={pr.status} />
            <p className="meta mt-3">since {pr.year.started}</p>
          </div>
        </header>

        <div className="grid gap-12 border-t border-rule-strong pt-10 md:grid-cols-12">
          <div className="md:col-span-7">
            {pr.definition && (
              <section>
                <h2 className="meta">Working definition</h2>
                <p className="mt-3 max-w-[var(--measure)] text-xl leading-snug">{pr.definition}</p>
              </section>
            )}
            {pr.principle && (
              <section className="mt-10">
                <h2 className="meta">Central principle</h2>
                <p className="mt-3 max-w-[var(--measure)] border-l border-rule-strong pl-5 text-xl leading-snug">
                  {pr.principle}
                </p>
              </section>
            )}
            {pr.workflow.length > 0 && (
              <section className="mt-10">
                <h2 className="meta">Core learner workflow</h2>
                <div className="mt-4">
                  <Flow steps={pr.workflow} />
                </div>
              </section>
            )}
            {pr.questions.length > 0 && (
              <section className="mt-10">
                <h2 className="meta">Research questions</h2>
                <ol className="mt-4 max-w-[var(--measure)] space-y-2">
                  {pr.questions.map((q, i) => (
                    <li key={q} className="flex gap-4 border-t border-rule py-2">
                      <span className="mono text-xs text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            {doc && <div className="prose mt-12 border-t border-rule-strong pt-8">{doc.content}</div>}
            {!doc && (
              <div className="placeholder mt-12">
                Program essay not yet written. The registry record is complete; the narrative is pending human authorship.
              </div>
            )}
          </div>

          <aside className="md:col-span-4 md:col-start-9">
            {pr.outputs.length > 0 && (
              <>
                <h2 className="meta mb-2">Supports</h2>
                <p className="text-sm text-ink-2">{pr.outputs.join(" · ")}</p>
              </>
            )}
            {pr.experiments.length > 0 && (
              <>
                <h2 className="meta mb-2 mt-8">Experiments</h2>
                <ul className="text-sm">
                  {pr.experiments.map((e) => (
                    <li key={e.id} className="border-t border-rule py-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <span>
                          <span className="mono text-ink-2">{e.id}</span> {e.title}
                        </span>
                        <StatusDot status={e.status} />
                      </div>
                      <p className="mt-1 text-ink-2">{e.summary}</p>
                      {e.project && (
                        <p className="mono mt-1 text-xs text-ink-3">→ {e.project}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {projects.length > 0 && (
              <>
                <h2 className="meta mb-2 mt-8">Projects in this program</h2>
                <ul className="text-sm">
                  {projects.map((p) => (
                    <li key={p.id} className="border-t border-rule py-2">
                      {isPublished(p, hasContent("work", p.slug)) ? (
                        <Link href={`/work/${p.slug}`} className="link-quiet">
                          <span className="mono text-ink-2">{p.id}</span> {p.title}
                        </Link>
                      ) : (
                        <span>
                          <span className="mono text-ink-2">{p.id}</span> {p.title}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="mt-8">
              <Stamp>registry/programs/{pr.id}.yaml</Stamp>
            </div>
          </aside>
        </div>
      </article>
    </Page>
  );
}
