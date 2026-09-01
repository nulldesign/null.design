import Link from "next/link";
import { NulMark, Wordmark } from "./marks";

export const NAV = [
  { href: "/", label: "Index" },
  { href: "/work", label: "Work" },
  { href: "/research", label: "Research" },
  { href: "/process", label: "Process" },
  { href: "/studio", label: "Studio" },
] as const;

export function Header() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-[88rem] items-baseline justify-between gap-6 px-[var(--gutter)] py-4">
        <div className="flex items-baseline gap-4">
          <Wordmark />
          <span className="meta hidden sm:inline">independent computational studio</span>
        </div>
        <nav aria-label="Primary">
          <ul className="meta flex gap-4 sm:gap-6">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="link-quiet text-ink hover:text-accent">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule-strong">
      <div className="mx-auto grid max-w-[88rem] grid-cols-2 gap-x-8 gap-y-10 px-[var(--gutter)] py-10 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <NulMark size={28} />
          <p className="mt-4 text-sm leading-snug">
            <Wordmark href={null} />
            <br />
            <span className="text-ink-2">independent computational studio</span>
          </p>
        </div>
        <dl className="text-sm">
          <dt className="meta">Address</dt>
          <dd className="mono mt-1">null.design</dd>
          <dt className="meta mt-4">Contact</dt>
          <dd className="mt-1">
            <a className="link-quiet" href="mailto:studio@null.design">
              studio@null.design
            </a>
          </dd>
        </dl>
        <dl className="text-sm">
          <dt className="meta">Sections</dt>
          {NAV.map((n) => (
            <dd key={n.href} className="mt-1">
              <Link className="link-quiet" href={n.href}>
                {n.label}
              </Link>
            </dd>
          ))}
          <dd className="mt-1">
            <Link className="link-quiet mono" href="/dev/null">
              /dev/null
            </Link>
          </dd>
        </dl>
        <dl className="text-sm">
          <dt className="meta">Machine-readable</dt>
          <dd className="mt-1">
            <a className="link-quiet mono" href="/feed.xml">
              /feed.xml
            </a>
          </dd>
          <dd className="mt-1">
            <a className="link-quiet mono" href="/registry.json">
              /registry.json
            </a>
          </dd>
          <dd className="mt-1">
            <a className="link-quiet mono" href="/sitemap.xml">
              /sitemap.xml
            </a>
          </dd>
          <dt className="meta mt-4">Colophon</dt>
          <dd className="mt-1 text-ink-2">
            IBM Plex · Next.js · registry-backed · built with human-directed agents
          </dd>
        </dl>
      </div>
      <div className="mx-auto flex max-w-[88rem] items-center justify-between px-[var(--gutter)] pb-8">
        <span className="meta">© {new Date().getFullYear()} Null Design</span>
        <span className="mono text-2xs text-ink-3">0x00</span>
      </div>
    </footer>
  );
}

/** Numbered section heading — the site's structural unit. */
export function Section({
  number,
  title,
  children,
  aside,
  id,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="border-t border-rule-strong py-10 md:py-14">
      <div className="grid gap-8 md:grid-cols-12">
        <div className="md:col-span-3">
          <h2 className="flex items-baseline gap-3 text-base font-medium">
            <span className="mono text-2xs text-ink-3">{number}</span>
            {title}
          </h2>
          {aside && <div className="mt-4 text-sm text-ink-2">{aside}</div>}
        </div>
        <div className="md:col-span-9">{children}</div>
      </div>
    </section>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[88rem] px-[var(--gutter)] outline-none">
      {children}
    </main>
  );
}

export function PageTitle({
  kicker,
  title,
  lede,
}: {
  kicker: string;
  title: string;
  lede?: React.ReactNode;
}) {
  return (
    <div className="py-12 md:py-16">
      <p className="meta">{kicker}</p>
      <h1 className="mt-3 text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.02em]">
        {title}
      </h1>
      {lede && <div className="mt-5 max-w-[var(--measure)] text-lg leading-relaxed text-ink-2">{lede}</div>}
    </div>
  );
}
