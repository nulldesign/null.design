import Link from "next/link";
import { Page } from "@/components/site";

export default function NotFound() {
  return (
    <Page>
      <div className="py-24">
        <p className="mono text-sm text-ink-2">0x00 · not found</p>
        <h1 className="mt-3 text-[clamp(2rem,5vw,3.5rem)] font-medium tracking-[-0.025em]">
          [&nbsp;&nbsp;]
        </h1>
        <p className="mt-4 max-w-[var(--measure)] text-ink-2">
          This address is unassigned. It may be reserved for future work, or it may have been
          deliberately routed to <span className="mono">/dev/null</span>.
        </p>
        <p className="mt-6">
          <Link href="/" className="link">
            Index →
          </Link>
        </p>
      </div>
    </Page>
  );
}
