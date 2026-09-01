# Null Operator — roles

Roles are computational contracts: a scope, allowed tools, an output type, and things the role may not do. They are not personas. Any model or runtime may fill a role for a run; the run record says which did.

| Role | Does | May not | Typical substrate today |
|---|---|---|---|
| Scout | searches sources (repos, feeds, arXiv, filesystems) and emits candidates with provenance | judge, publish | Sonnet subagents; Hermes skills |
| Researcher | reads, extracts, compares; produces notes with citations | make claims without sources | Sonnet/Opus subagents |
| Builder | implements against a test/contract; only the named files | edit tests; touch unrelated files | GLM 5.3 Flash (OpenCode), GPT-5.6 Sol/Luna (Codex), Hermes over SSH |
| Analyst | runs data/evals; tables and figures with method notes | interpret beyond the data | Sonnet; Python in sandbox |
| Critic | adversarial review: fabrication, hype, leakage, provenance, accessibility | approve | Opus |
| Archivist | writes run records; updates registry; stores artifacts | delete | lead agent |
| Publisher | builds, previews, prepares branch/PR; deploys after the human gate | merge unapproved | lead agent + CI |
| Operator | routes work between roles; enforces gates; logs | act externally | Claude Code (lead) |

## Canonical flow

```
Scout → Researcher → Builder → Critic → HUMAN GATE → Archivist → Publisher
```

## Human gate (always a person)

strategic direction · publication approval · consequential external actions · client commitments · financial decisions · research claims

## Run record

Every run writes `registry/runs/RUN-YYYY-NNNN.yaml` (schema: `RunRecord`). Minimum: id, date, title, trigger, human_director, roles[], tools[], artifacts[], critiques[], human_decisions[], result. `npm run registry:validate` refuses malformed records.

## Dispatch

`agents/dispatch.sh <job> <prompt> --backend opencode|codex|hermes --gate "<cmd>"`. Tests first; the gate is the truth. Logs in `.dispatch/` (gitignored). `HERMES_HOST` is never committed.
