#!/usr/bin/env bash
# Null Operator — dispatch a narrow, test-specified job to a worker model.
#
#   agents/dispatch.sh <job> <prompt-file|-> [--backend opencode|codex|hermes] [--model <id>]
#                      [--gate "<shell cmd>"] [--out <path>] [-- <extra backend args>]
#
# Backends (non-interactive; logs in .dispatch/<job>.*, gitignored):
#   opencode  GLM 5.3 Flash via OpenRouter (default). Edits files in the repo directly.
#   codex     OpenAI Codex CLI. --model gpt-5.6-sol (default) | gpt-5.6-luna. Edits files directly.
#   hermes    A Hermes agent reached over SSH (HERMES_HOST must be set; no default is shipped).
#             Runs remotely in a scratch dir; the worker must reply with ONE fenced code block,
#             which is written to --out <path> locally. Use for single-file jobs.
#
# The worker receives AGENTS.md as its working agreement. Exit 0 only if the worker finished
# AND the gate passed. The gate output is the truth, not the worker's self-report.
set -euo pipefail

usage() { sed -n '2,16p' "$0"; exit 2; }
[[ $# -ge 2 ]] || usage

JOB="$1"; PROMPT_SRC="$2"; shift 2
BACKEND="${DISPATCH_BACKEND:-opencode}"; MODEL=""; GATE=""; OUT=""; EXTRA=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend) BACKEND="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    --gate) GATE="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --) shift; EXTRA=("$@"); break ;;
    *) EXTRA+=("$1"); shift ;;
  esac
done

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT/.dispatch"; mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/$JOB.log"; ERR="$LOG_DIR/$JOB.err"; LAST="$LOG_DIR/$JOB.last.md"

if [[ "$PROMPT_SRC" == "-" ]]; then PROMPT="$(cat)"; else PROMPT="$(cat "$PROMPT_SRC")"; fi
CONTRACT="$(cat "$ROOT/AGENTS.md" 2>/dev/null || true)"

case "$BACKEND" in
  opencode) MODEL="${MODEL:-openrouter/z-ai/glm-5.3-flash}" ;;
  codex)    MODEL="${MODEL:-gpt-5.6-sol}" ;;
  hermes)   MODEL="${MODEL:-z-ai/glm-5.3-flash}"; : "${HERMES_HOST:?set HERMES_HOST=user@host (never commit it)}" ;;
  *) echo "unknown backend: $BACKEND" >&2; exit 2 ;;
esac

echo "▶ dispatch[$JOB] backend=$BACKEND model=$MODEL" >&2
START=$(date +%s)
set +e
case "$BACKEND" in
  opencode)
    opencode run --model "$MODEL" --auto --dir "$ROOT" --title "dispatch:$JOB" --format json \
      ${EXTRA[@]+"${EXTRA[@]}"} "$PROMPT" < /dev/null > "$LOG" 2> "$ERR"
    STATUS=$?
    node - "$LOG" > "$LAST" <<'JS'
const fs = require('node:fs');
let text = '', tokens = 0, cost = 0, tools = 0;
for (const line of fs.readFileSync(process.argv[2], 'utf8').split('\n')) {
  let ev; try { ev = JSON.parse(line); } catch { continue; }
  if (ev.type === 'text') text = ev.part?.text ?? text;
  if (ev.type === 'tool_use' || ev.type === 'tool') tools++;
  if (ev.type === 'step_finish') { tokens += ev.part?.tokens?.total ?? 0; cost += ev.part?.cost ?? 0; }
}
process.stdout.write(text.trim() + `\n\n<!-- tools=${tools} tokens=${tokens} cost=$${cost.toFixed(4)} -->\n`);
JS
    ;;
  codex)
    ( cd "$ROOT" && codex exec -m "$MODEL" -s workspace-write -c approval_policy=never \
        --skip-git-repo-check --json -o "$LAST" ${EXTRA[@]+"${EXTRA[@]}"} - <<<"$PROMPT" ) > "$LOG" 2> "$ERR"
    STATUS=$?
    node - "$LOG" >> "$LAST" <<'JS'
const fs = require('node:fs');
let usage = null, tools = 0;
for (const line of fs.readFileSync(process.argv[2], 'utf8').split('\n')) {
  let ev; try { ev = JSON.parse(line); } catch { continue; }
  if (ev.type === 'item.completed' && ev.item?.type !== 'agent_message') tools++;
  if (ev.type === 'turn.completed') usage = ev.usage;
}
process.stdout.write(`\n\n<!-- tools=${tools} tokens=${usage ? usage.input_tokens + usage.output_tokens : 0} -->\n`);
JS
    ;;
  hermes)
    [[ -n "$OUT" ]] || { echo "hermes backend needs --out <path>" >&2; exit 2; }
    REMOTE_DIR="work/dispatch/$JOB"
    REMOTE_PROMPT="$(printf '%s\n\n---\nWorking agreement:\n%s\n\n---\nIMPORTANT: You have no access to the repository. Reply with exactly ONE fenced code block containing the complete file contents for %s, and nothing else outside the block.\n' "$PROMPT" "$CONTRACT" "$OUT")"
    ssh -o BatchMode=yes -o ConnectTimeout=10 "$HERMES_HOST" \
      "export PATH=\$HOME/.local/bin:/opt/homebrew/bin:\$PATH; mkdir -p ~/$REMOTE_DIR && cd ~/$REMOTE_DIR && cat > prompt.md && HERMES_ACCEPT_HOOKS=1 hermes chat --query-file prompt.md --oneshot -Q --yolo -m '$MODEL' --provider openrouter --max-turns 12 < /dev/null" \
      <<<"$REMOTE_PROMPT" > "$LOG" 2> "$ERR"
    STATUS=$?
    node - "$LOG" "$ROOT/$OUT" > "$LAST" <<'JS'
const fs = require('node:fs');
const raw = fs.readFileSync(process.argv[2], 'utf8');
const m = raw.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
if (m) { fs.mkdirSync(require('node:path').dirname(process.argv[3]), { recursive: true }); fs.writeFileSync(process.argv[3], m[1]); }
const session = (raw.match(/session_id:\s*(\S+)/) || [])[1] || '';
process.stdout.write((m ? `wrote ${process.argv[3]} (${m[1].split('\n').length} lines)` : 'NO CODE BLOCK IN REPLY') + `\n\n<!-- session=${session} -->\n`);
JS
    ;;
esac
set -e
ELAPSED=$(( $(date +%s) - START ))

echo "── worker final message ──"; cat "$LAST"
echo "── backend=$BACKEND elapsed=${ELAPSED}s exit=${STATUS}" >&2

if [[ $STATUS -ne 0 ]]; then echo "✗ worker failed (see $ERR)" >&2; tail -20 "$ERR" >&2; exit 1; fi
if [[ -n "$GATE" ]]; then
  echo "▶ gate: $GATE" >&2
  if (cd "$ROOT" && bash -c "$GATE") > "$LOG_DIR/$JOB.gate" 2>&1; then echo "✓ GATE PASS" >&2
  else echo "✗ GATE FAIL (see $LOG_DIR/$JOB.gate)" >&2; tail -40 "$LOG_DIR/$JOB.gate" >&2; exit 1; fi
fi
