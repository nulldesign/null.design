import Link from "next/link";
import { getRegistry } from "@/lib/registry";
import { hasContent } from "@/lib/content";
import { Page, Section } from "@/components/site";
import { Flow, ProgramCard, ProjectCard, isPublished } from "@/components/registry-views";
import { NulMark, Stamp } from "@/components/marks";

export default function Home() {
  const reg = getRegistry();
  const featured = reg.projects
    .filter((p) => p.visibility === "public" && p.publication.featured)
    .sort((a, b) => (a.publication.order ?? 99) - (b.publication.order ?? 99));
  const programs = reg.programs.filter((p) => p.visibility === "public" && p.publication.featured);
  const run = reg.runs.at(-1);
  const dispatches = (role: string) => run?.roles.filter((r) => r.role === role).length ?? 0;

  return (
    <Page>
      {/* 0 — thesis */}
      <section className="grid gap-10 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-8">
          <h1 className="text-[clamp(2.75rem,9vw,7rem)] font-medium leading-[0.95] tracking-[-0.035em]">
            null design
          </h1>
          <p className="meta mt-5">independent computational studio</p>
          <p className="mt-10 max-w-[30ch] text-[clamp(1.375rem,2.6vw,2rem)] leading-[1.25] tracking-[-0.015em]">
            Null Design explores how computation can expand human agency.
          </p>
          <p className="mt-6 max-w-[var(--measure)] text-lg leading-relaxed text-ink-2">
            We design intelligent systems, learning environments, software and experiments using
            computation as both material and collaborator. The studio operates as a research
            practice, a selective design and engineering studio, and a developer of reusable tools.
          </p>
        </div>
        <div className="md:col-span-4 md:justify-self-end">
          <NulMark size={88} className="text-ink" />
          <dl className="mt-8 text-sm">
            <div className="grid grid-cols-3 border-t border-rule py-2">
              <dt className="meta">Address</dt>
              <dd className="mono col-span-2">null.design</dd>
            </div>
            <div className="grid grid-cols-3 border-t border-rule py-2">
              <dt className="meta">Practices</dt>
              <dd className="col-span-2 text-ink-2">
                intelligent systems · agentic systems · learning environments · software · research
                infrastructure · automation · data systems · physical computing · fabrication ·
                experimental interfaces
              </dd>
            </div>
            <div className="grid grid-cols-3 border-t border-rule py-2">
              <dt className="meta">Material</dt>
              <dd className="col-span-2 text-ink-2">
                AI is a material the studio uses. It is not the studio&apos;s identity.
              </dd>
            </div>
            <div className="grid grid-cols-3 border-t border-b border-rule py-2">
              <dt className="meta">Last run</dt>
              <dd className="col-span-2">
                {run ? <Stamp>{run.id}</Stamp> : <span className="mono">[ ]</span>}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 1 — work */}
      <Section
        number="01"
        title="Selected work"
        aside={
          <p>
            Real systems, described at the level of architecture. Metrics are counts that exist;
            nothing is estimated.{" "}
            <Link href="/work" className="link">
              Full index →
            </Link>
          </p>
        }
      >
        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
          {featured.map((p) => (
            <li key={p.id}>
              <ProjectCard p={p} href={isPublished(p, hasContent("work", p.slug)) ? `/work/${p.slug}` : null} />
            </li>
          ))}
        </ul>
      </Section>

      {/* 2 — research */}
      <Section
        number="02"
        title="Research"
        aside={
          <p>
            Programs produce ideas, essays, experiments, methods and open research.{" "}
            <Link href="/research" className="link">
              Research →
            </Link>
          </p>
        }
      >
        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
          {programs.map((pr) => (
            <li key={pr.id}>
              <ProgramCard pr={pr} href={`/research/${pr.slug}`} />
            </li>
          ))}
        </ul>
        {programs[0]?.principle && (
          <blockquote className="mt-12 max-w-[var(--measure)] border-l border-rule-strong pl-5 text-lg leading-snug">
            {programs[0].principle}
            <footer className="meta mt-2">{programs[0].id} — {programs[0].title}</footer>
          </blockquote>
        )}
      </Section>

      {/* 3 — process */}
      <Section
        number="03"
        title="Process"
        aside={
          <p>
            The studio is itself an example of human-directed agentic orchestration. Agents have
            defined computational roles; a human holds the gates.{" "}
            <Link href="/process" className="link">
              How we work →
            </Link>
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
              Agents search, read, draft, build against tests and critique. A human sets direction,
              approves publication, makes client and financial commitments and owns every research
              claim. Each run is recorded — trigger, inputs, tools, roles, artifacts, critiques,
              decisions — and the record is the source for what appears here.
            </p>
            <p className="mt-4">
              This page was produced by <span className="mono text-ink">{run?.id ?? "[ ]"}</span>:
              one Operator under human direction; {dispatches("Scout")} Scout, {dispatches("Researcher")}{" "}
              Researcher, {dispatches("Builder")} Builder and {dispatches("Critic")} Critic dispatches. Nothing
              was deployed or transferred without a recorded decision.
            </p>
          </div>
        </div>
      </Section>

      {/* 4 — studio */}
      <Section
        number="04"
        title="Studio"
        aside={
          <Link href="/studio" className="link">
            Studio →
          </Link>
        }
      >
        <p className="max-w-[var(--measure)] text-lg leading-relaxed">
          Null Design is available for selected commissions, collaborations and research
          partnerships: agentic systems, research tooling, educational systems, computational
          curriculum, internal software, data applications, prototypes and automation
          infrastructure.
        </p>
        <p className="mt-6">
          <a className="link" href="mailto:studio@null.design">
            studio@null.design
          </a>
        </p>
      </Section>
    </Page>
  );
}
