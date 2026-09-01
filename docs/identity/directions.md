# Null Design — identity directions

Restraint is the identity. Four coherent directions share one system; none is a pictorial logo.

## Primary

**Wordmark** `null design` — lowercase, IBM Plex Sans Medium, tracking −0.01 to −0.035 em depending on size, one colour. Always set as live text. Rendered by `Wordmark` in `src/components/marks.tsx`.

**Byline** *independent computational studio* — Plex Mono, small caps via uppercase + 0.04 em tracking (`.meta`).

**Address** `null.design` — Plex Mono, used as the running identifier in header, footer, OG image and printed matter. The domain is the graphic asset.

## Direction A — NUL (␀, U+2400 SYMBOL FOR NULL)

**Finding (2026-09-01):** the glyph is present in JetBrains Mono, Fira Code, Cascadia Code, Apple Symbols and Arial Unicode MS on the reference machine, and absent from the UI families (Plex Sans/Mono, Inter, system sans). Relying on the font glyph would produce tofu for most visitors.

**Decision:** draw it. `NulMark` is an SVG that follows the Unicode chart construction — N, U, L stepping diagonally inside a square, 1.5 px strokes, square caps. It scales from favicon (16 px) to hero (88 px) without change. It carries `role="img"` and `aria-label="null"`; the wordmark is never replaced by the mark alone.

Uses: favicon (`src/app/icon.svg`), footer, studio contact block, run stamps, OG image corner. Studies: `public/identity/nul-*.svg`.

## Direction B — ADDRESS

`null.design` in Plex Mono as a lockup with the byline:

```
null.design
INDEPENDENT COMPUTATIONAL STUDIO
```

Strongest for recognition and requires no explanation. Used on the OG image and as the footer's first field.

## Direction C — MEMORY

`0x00` — the null byte — as a tertiary technical mark for surfaces that are about the machinery: 404 page, colophon, run stamps, `/dev/null`. Always small, always monospaced, never the headline. This keeps it documentation-flavoured rather than security-branded.

## Direction D — CONTAINER

`[ ]` `{ }` `_` as a layout language for undefined or unassigned space:

- `[ ]` marks placeholders (`.placeholder::before`) and the 404 headline;
- `{ }` reserved for future interactive states (empty result sets, unassigned registry fields);
- `_` is the baseline rule and the cursor — hairline rules throughout the site are this motif at page scale.

## Hierarchy

```
PRIMARY     null design
SECONDARY   ␀
TERTIARY    0x00   /dev/null   { }   [ ]   _   NULL
```

## Tokens

Defined in `src/app/globals.css`:

| token | light | dark | role |
|---|---|---|---|
| `--paper` | #fbfbf9 | #0f0f0e | ground |
| `--paper-2` | #f2f2ee | #171716 | code, insets |
| `--ink` | #101010 | #ecece8 | text |
| `--ink-2` | #4a4a46 | #b4b4ae | secondary text |
| `--ink-3` | #6d6d67 | #8f8f89 | metadata, numbering |
| `--rule` | #d9d9d3 | #2a2a28 | hairlines |
| `--rule-strong` | = ink | = ink | section rules |
| `--accent` | #1f3fbf | #7c93ff | links, active states only |

Contrast (computed 2026-09-01, WCAG relative luminance): ink 18.4:1 / 16.2:1; ink-2 8.6:1 / 9.2:1; ink-3 5.0:1 / 5.9:1; accent 8.0:1 / 6.8:1 (light / dark). All exceed 4.5:1; ink-3 was darkened from #8a8a84 (3.4:1) after the RUN-2026-0001 critique.

Type: IBM Plex Sans 400/500 (+ italic), IBM Plex Mono 400/500, via `next/font/google` with `display: swap`. Plex is chosen for its Bell Labs/IBM technical-documentation lineage, its excellent mono/sans pairing, and its OFL licence. No third family.
