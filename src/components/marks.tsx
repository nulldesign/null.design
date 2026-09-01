import Link from "next/link";

/**
 * PRIMARY — wordmark. Lowercase, one weight, tight tracking. Text, not an image,
 * so it inherits colour, scales and is always selectable/readable.
 */
export function Wordmark({
  href = "/",
  size = "base",
}: {
  href?: string | null;
  size?: "base" | "lg" | "xl";
}) {
  const cls = {
    base: "text-[1.0625rem] tracking-[-0.01em]",
    lg: "text-[1.75rem] tracking-[-0.02em]",
    xl: "text-[clamp(2.5rem,8vw,5.5rem)] tracking-[-0.03em] leading-[0.95]",
  }[size];
  const inner = (
    <span className={`font-medium ${cls}`}>
      null<span className="text-ink-3 font-normal">&nbsp;</span>design
    </span>
  );
  return href ? (
    <Link href={href} aria-label="null design — home" className="inline-block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/**
 * SECONDARY — ␀ SYMBOL FOR NULL (U+2400), drawn as an SVG rather than relying
 * on the glyph, because most UI webfonts lack the Control Pictures block.
 * The construction follows the Unicode chart: N, U, L stepping diagonally
 * inside a square.
 */
export function NulMark({
  size = 24,
  title = "null",
  className = "",
}: {
  size?: number;
  title?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <title>{title}</title>
      {/* frame */}
      <rect x="0.75" y="0.75" width="22.5" height="22.5" />
      {/* N — top-left */}
      <path d="M3.5 10V3.5L8 10V3.5" />
      {/* U — centre */}
      <path d="M9.5 8v5.25a2.25 2.25 0 0 0 4.5 0V8" />
      {/* L — bottom-right */}
      <path d="M16 13.5V20.5H20.5" />
    </svg>
  );
}

/** TERTIARY — technical stamps for run IDs, colophons, /dev/null. */
export function Stamp({ children }: { children: React.ReactNode }) {
  return (
    <span className="mono inline-block border border-rule px-1.5 py-[1px] text-2xs tracking-[0.04em] text-ink-2">
      {children}
    </span>
  );
}

/** CONTAINER — visible "unassigned" state. */
export function Empty({ label = "unassigned" }: { label?: string }) {
  return (
    <span className="mono text-ink-3" aria-label={label}>
      [&nbsp;&nbsp;]
    </span>
  );
}
