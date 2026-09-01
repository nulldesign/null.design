# `null publish <ID>` — publishing pipeline (design)

Status: designed, executed by hand with agent help. Not automated. The non-gated stages are shaped so they can be scripted later without moving the gate.

```
validate registry
→ inspect repository
→ collect project artifacts
→ draft case study
→ verify provenance
→ generate metadata
→ run critique
→ create website branch
→ build
→ preview
→ HUMAN APPROVAL
→ merge
→ deploy
→ archive run
```

## Stages

| # | Stage | Role | Input | Output | Automatable now? |
|---|---|---|---|---|---|
| 1 | validate registry | Operator | `registry/**` | pass/fail + problems | yes — `npm run registry:validate` |
| 2 | inspect repository | Scout | `repositories[].url` | facts file: commits, authors, dates, licence, deps, CI, README claims | yes (read-only `gh`/`git`) |
| 3 | collect artifacts | Scout | repo + facts | screenshots/diagrams list with captions and dates | partly; screenshots need a browser run and a human eye |
| 4 | draft case study | Researcher | registry record + facts + template | `content/work/<slug>.mdx` with `<Placeholder>` for unknowns | yes (constrained prompt; see RUN-2026-0001) |
| 5 | verify provenance | Critic | draft + facts | provenance diff: every claim → source; flags | yes, with a human reading flags |
| 6 | generate metadata | Builder | registry + draft | OG, RSS item, sitemap entry | yes (build does this) |
| 7 | run critique | Critic | full page render | findings: fabrication, hype language, leakage, accessibility | yes |
| 8 | create branch | Publisher | changes | `publish/<ID>` branch | yes |
| 9 | build | Publisher | branch | `next build` log | yes |
| 10 | preview | Publisher | build | preview URL | yes (Vercel preview) |
| 11 | **human approval** | human | preview + critique + provenance diff | decision written to `registry/runs/RUN-*.yaml` | **never** |
| 12 | merge | Publisher | approval | merge commit | only after 11 |
| 13 | deploy | Publisher | merge | production deployment | only after 11 |
| 14 | archive run | Archivist | everything | run record complete, `result.commit`, `result.publication` | yes |

## Gate semantics

- A gate is a *recorded* decision, not an absence of objection. `human_decisions[].outcome` must be `approved` with a date before stages 12–13 run.
- Critique findings are attached to the run (`critiques[]`) whether or not they are acted on.
- If the registry does not validate, nothing else runs.

## Leakage checks (stage 7, minimum list)

IPv4/IPv6 literals · tailnet or internal hostnames · ports · local filesystem paths · e-mail addresses other than `studio@null.design` · school names, course codes, SIS identifiers · student names · health or financial figures · environment variable names with values · API keys (entropy scan) · "student project" attributions without consent on file.

## Language checks (stage 7)

Banned: AI solutions · revolutionize · unlock the power · 10x · AI transformation · seamless · cutting-edge · leverage · game-changing · empower (as marketing) · exclamation marks in body copy.

## Future command

`scripts/publish.ts <ID> [--dry-run]` should implement stages 1–10 and 14, stop at 11 with a printed checklist, and refuse to run 12–13 unless the run record carries an approval.
