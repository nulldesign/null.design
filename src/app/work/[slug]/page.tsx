import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRegistry } from "@/lib/registry";
import { compileContent, listContent } from "@/lib/content";
import { Page } from "@/components/site";
import { ProjectSpec, StatusDot, isPublished } from "@/components/registry-views";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  const reg = getRegistry();
  return listContent("work")
    .filter((slug) => {
      const p = reg.projectBySlug.get(slug);
      return p !== undefined && isPublished(p, true);
    })
    .map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getRegistry().projectBySlug.get(slug);
  if (!p) return {};
  return {
    title: `${p.title} (${p.id})`,
    description: p.summary,
    openGraph: { title: `${p.title} — null design`, description: p.summary, type: "article" },
  };
}

export default async function WorkEntry({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const reg = getRegistry();
  const p = reg.projectBySlug.get(slug);
  if (!p || !isPublished(p, true)) notFound();
  const doc = await compileContent("work", slug);
  if (!doc) notFound();

  const programs = p.research_programs
    .map((id) => reg.programs.find((pr) => pr.id === id))
    .filter((pr): pr is NonNullable<typeof pr> => pr !== undefined);

  return (
    <Page>
      <article>
        <header className="grid gap-8 py-12 md:grid-cols-12 md:py-16">
          <div className="md:col-span-8">
            <p className="meta">
              <Link href="/work" className="link-quiet">
                Work
              </Link>{" "}
              / <span className="mono normal-case">{p.id}</span>
            </p>
            <h1 className="mt-3 text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.025em]">
              {p.title}
            </h1>
            {doc.frontmatter.deck && (
              <p className="mt-5 max-w-[var(--measure)] text-xl leading-snug text-ink-2">{doc.frontmatter.deck}</p>
            )}
          </div>
          <div className="md:col-span-4 md:justify-self-end md:text-right">
            <StatusDot status={p.status} />
            {p.facts.length > 0 && (
              <dl className="mt-4 grid grid-cols-[auto_auto] gap-x-6 gap-y-1 md:justify-end">
                {p.facts.map((f) => (
                  <div key={f.label} className="contents">
                    <dt className="meta text-left">{f.label}</dt>
                    <dd className="mono text-left text-xs">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </header>

        <div className="grid gap-12 border-t border-rule-strong pt-10 md:grid-cols-12">
          <div className="prose md:col-span-7">{doc.content}</div>
          <aside className="md:col-span-4 md:col-start-9">
            <h2 className="meta mb-2">Specification</h2>
            <ProjectSpec p={p} />
            {programs.length > 0 && (
              <>
                <h2 className="meta mb-2 mt-8">Research programs</h2>
                <ul className="text-sm">
                  {programs.map((pr) => (
                    <li key={pr.id} className="border-t border-rule py-2">
                      <Link href={`/research/${pr.slug}`} className="link-quiet">
                        <span className="mono text-ink-2">{pr.id}</span> {pr.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {p.provenance.notes && (
              <>
                <h2 className="meta mb-2 mt-8">Provenance notes</h2>
                <p className="text-sm leading-snug text-ink-2">{p.provenance.notes}</p>
              </>
            )}
          </aside>
        </div>
      </article>
    </Page>
  );
}
