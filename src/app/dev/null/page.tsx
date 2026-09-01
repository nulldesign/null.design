import type { Metadata } from "next";
import { listContent, compileContent } from "@/lib/content";
import { Page, PageTitle } from "@/components/site";
import { Stamp } from "@/components/marks";

export const metadata: Metadata = {
  title: "/dev/null",
  description:
    "The Null Design experimental archive: failed experiments, abandoned ideas, negative findings, discarded prototypes and strange computational sketches.",
  robots: { index: true, follow: true },
};

export default async function DevNull() {
  const slugs = listContent("dev-null");
  const entries = (await Promise.all(slugs.map((s) => compileContent("dev-null", s)))).filter(
    (e): e is NonNullable<typeof e> => e !== null,
  );

  return (
    <Page>
      <PageTitle
        kicker="/dev/null"
        title="Experimental archive"
        lede={
          <>
            Where discarded work goes to stay useful: failed experiments, abandoned ideas, negative
            findings, discarded prototypes and strange computational sketches. Everything here was
            deliberately approved for publication; nothing arrives automatically.
          </>
        }
      />
      <p className="mono border-t border-rule-strong pt-6 text-xs text-ink-2">
        entries: {entries.length}
      </p>
      {entries.length === 0 ? (
        <div className="placeholder mt-10 max-w-[var(--measure)]">
          No entries yet. Candidates identified in RUN-2026-0001 — a 2015 landing page for a studio that
          did not begin, an earlier education lab&apos;s VR experiments, a folder of SuperCollider synth
          definitions — await a human decision before they appear here.
        </div>
      ) : (
        <ul className="mt-10">
          {entries.map((e) => (
            <li key={e.frontmatter.slug} className="border-t border-rule py-8">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-medium">{e.frontmatter.title}</h2>
                <Stamp>{e.frontmatter.id}</Stamp>
              </div>
              {e.frontmatter.deck && <p className="mt-2 text-ink-2">{e.frontmatter.deck}</p>}
              <div className="prose mt-6">{e.content}</div>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
