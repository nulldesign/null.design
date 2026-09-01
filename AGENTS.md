# AGENTS.md — Null Design working agreement

This repository is the public website, project registry and operating manual of **Null Design**, an independent computational studio. It is designed so that coding and research agents can work in it safely. Read this whole file before changing anything.

## 1. What this is

Null Design investigates how computation can expand human agency. It operates as a research practice, a selective design and engineering studio, and a developer of reusable tools. AI is a material the studio uses; it is not the studio's identity.

The site must never read as an "AI agency". No "AI solutions", "revolutionize", "unlock the power of", "10x", "transformation", sparkles, robots, gradients or glowing networks. Prefer plain sentences, real screenshots, diagrams, tables, code and run metadata.

## 2. Layout

```
/registry     canonical machine-readable metadata (YAML) — the source of truth
  schema.ts   zod schemas for projects, programs, products, runs
  projects/   ND-001.yaml …      programs/ ND-R01.yaml …
  products/   ND-P01.yaml …      runs/     RUN-2026-0001.yaml …
/content      narrative MDX keyed by slug: work/, research/, dev-null/
/src          Next.js App Router site (TypeScript, Tailwind v4, zero client JS by default)
/agents       role definitions, dispatch harness, prompt templates
/docs         discovery report, identity studies, architecture notes
/public       static assets (real images only; no stock imagery)
/scripts      validation and build utilities
```

Registry first, prose second. A page may only display a project that validates against `registry/schema.ts`. Run `npm run registry:validate` before committing.

## 3. Catalogue grammar

| Kind | Pattern | Example |
|---|---|---|
| General work | `ND-NNN` | `ND-002` |
| Research program | `ND-RNN` | `ND-R01` |
| Agentic Education experiment | `AE-NNN` | `AE-001` |
| Product | `ND-PNN` | `ND-P01` |
| Agent run | `RUN-YYYY-NNNN` | `RUN-2026-0001` |

IDs are permanent. Never renumber. Slugs are lowercase-kebab and stable once published.

## 4. Content conventions

- Every factual statement about a project (dates, counts, stack, status, usage) must be traceable to the registry entry or to the repository it describes. **Never fabricate metrics, users, testimonials, screenshots or results.** If something is unknown, write `[placeholder: …]` and leave it visibly unfinished.
- Provenance is displayed, not hidden: ownership, third-party components, AI co-authorship.
- Third-party systems (Hermes/Nous Research, n8n, OpenBB, Ghostfolio, Honcho, Ollama…) are always named as third-party.
- Agents are described as computational roles with scopes, never as people or "team members".
- Hosts are described as "an always-on Mac" or "a VPS". Never addresses, hostnames, tailnet names, ports.
- No student names, grades, school-internal identifiers, health data, financial holdings, calendars, messages, vault contents or environment variables — anywhere, including examples and fixtures.
- Frontmatter in MDX mirrors the registry `id` and `slug`; the registry wins on conflict.

## 5. Prohibited without a recorded human decision

Agents may draft, build, test, preview and propose. Agents may **not**:

- deploy to production or change DNS;
- merge to `main`;
- transfer, mirror, rename, archive or delete repositories;
- publish to `/dev/null` (every entry there is deliberately approved);
- launch, price or advertise a paid product;
- make commitments to clients, partners or institutions;
- send email or post externally;
- state a research claim as Null Design's position.

A human decision is recorded in the run record (`registry/runs/RUN-*.yaml`, `human_decisions[]`) before the action happens.

## 6. Publication workflow (`null publish <ID>`)

validate registry → inspect repository → collect artifacts → draft case study → verify provenance → generate metadata → critique → branch → build → preview → **human approval** → merge → deploy → archive run.

Today this is executed by hand with agent help; the steps are fixed so tooling can automate the non-gated parts later.

## 7. Worker contract (dispatched jobs)

If you are a worker (OpenCode/GLM, Codex, Hermes or a subagent) dispatched by the lead with a narrow job:

- **Only touch the files named in your job.** No refactors, renames or "improvements" elsewhere.
- **Tests are the contract.** Make the named `*.test.ts` pass without editing it. If a test looks wrong, say so in your final message instead of changing it.
- **Strict TypeScript.** No `any`, no unused imports, no non-null assertions unless the job allows it.
- **Pure modules under `src/lib/` and `registry/`** have no React, no network, no filesystem unless the job says so.
- **Run the gate before finishing:** `npm run typecheck && npx vitest run <the test file>`.
- **Final message:** one line per file written, then `GATE: pass` or `GATE: fail <why>`. No prose beyond that.

## 8. Design principles

Restraint. One sans (IBM Plex Sans) and one mono (IBM Plex Mono). Paper and ink, one accent. Hairline rules, numbered sections, specification tables, captions. Typography and real artifacts carry the visual interest. Accessible by default: semantic HTML, visible focus, contrast ≥ 4.5:1, no motion that cannot be turned off. Zero client JavaScript unless an interaction requires it.

## 9. Stack notes

Next.js 16 App Router (read `node_modules/next/dist/docs/` before assuming APIs — `params` is a `Promise`; `proxy.ts` replaces `middleware.ts`), React 19, Tailwind v4 (`@theme inline` tokens in `src/app/globals.css`), `next-mdx-remote/rsc` for MDX, `js-yaml` + `zod` for the registry, `vitest` for tests. Path alias `@/*` → `src/*`; the registry is imported via relative path or `@registry/*`.
