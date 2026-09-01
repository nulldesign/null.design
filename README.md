# null design

*independent computational studio* — `null.design`

Null Design explores how computation can expand human agency. This repository holds the studio's public website, its canonical project registry, and the operating conventions that let human-directed agents work in it safely.

## Structure

```
registry/    canonical YAML records (projects ND-NNN, programs ND-RNN, products ND-PNN, runs RUN-YYYY-NNNN) + zod schema
content/     MDX narratives keyed by slug: work/, research/, dev-null/ (+ _templates/)
src/         Next.js 16 App Router site — TypeScript, Tailwind v4, zero client JS by default
agents/      Null Operator: roles, dispatch harness, prompt templates
docs/        discovery report, identity studies, architecture notes
public/      static assets (identity SVGs; real images only)
scripts/     registry validation
```

The registry is the source of truth. A page can only exist for a record that validates.

## Commands

```
npm run dev                 # local site
npm run build               # production build (statically prerendered routes)
npm run test                # vitest (ids, rss, registry loader)
npm run typecheck
npm run registry:validate   # schema + cross-reference checks
npm run check               # all of the above + lint
```

## Working here as an agent

Read [`AGENTS.md`](AGENTS.md) first. It defines the catalogue grammar, content rules (no fabricated metrics, no leakage, third-party attribution), the actions that require a recorded human decision, and the worker contract for dispatched jobs.

Dispatch a bounded job to a worker model (tests are the contract; the gate decides):

```
agents/dispatch.sh <job> <prompt-file> --backend opencode|codex|hermes --gate "npx vitest run <test>"
```

## Routes

`/` · `/work` · `/work/[slug]` · `/research` · `/research/[slug]` · `/process` · `/studio` · `/dev/null` · `/feed.xml` · `/registry.json` · `/sitemap.xml`

## Provenance

This repository was established in `RUN-2026-0001` (see `registry/runs/`): one lead agent under human direction, three scouting subagents, two worker models building tested modules, two drafting subagents, one critic. Nothing was deployed, transferred or published by the run. The discovery report behind it is private (see `docs/discovery/README.md`); its public residue is the registry, the case studies and the pending decisions in the run record.

## Licence

No licence has been chosen yet; until one is, all rights are reserved. A code licence is an open decision recorded in `registry/runs/RUN-2026-0001.yaml`.
