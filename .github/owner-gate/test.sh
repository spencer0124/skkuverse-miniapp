#!/usr/bin/env bash
# shellcheck disable=SC2016 # the ${{ }} run-name expressions here are literal text to replace
# Runs gate.sh against a fake `gh` that serves recorded API answers, one case per pull request history.
# Run from anywhere: bash .github/owner-gate/test.sh. Needs bash, jq and sed; no network.
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp/bin"
cat > "$tmp/bin/gh" <<'EOF'
#!/usr/bin/env bash
[ "$1" = api ] || exit 2
path=$2
key=$(printf '%s' "$path" | tr -c 'A-Za-z0-9' _)
# shellcheck disable=SC2053
if [ -n "${FAKE_GH_FAIL:-}" ] && [[ "$path" == $FAKE_GH_FAIL ]]; then echo "gh: HTTP 502 for $path" >&2; exit 1; fi
[ -f "$FAKE_GH_DIR/$key" ] || { echo "gh: HTTP 404 for $path" >&2; exit 1; }
cat "$FAKE_GH_DIR/$key"
EOF
chmod +x "$tmp/bin/gh"

A=$(printf 'a%.0s' {1..40})
B=$(printf 'b%.0s' {1..40})
C=$(printf 'c%.0s' {1..40})
D=$(printf 'd%.0s' {1..40})
owner=spencer0124
triage=contrib-member
repo=example/miniapp
pr=7
self_id=900
three_hundred=()
for i in $(seq 1 300); do three_hundred+=("packages/f$i.ts"); done

# The run-name line of the workflow, with each expression filled in, so a change to its format breaks these cases.
title() {
  local action=$1 label=$2 head=$3 by=$4 approval=false line
  [ "$label" = owner-approved ] && approval=true
  line=$(sed -n 's/^run-name: //p' "$root/.github/workflows/owner-gate.yml")
  line=${line//'${{ github.event.pull_request.number }}'/$pr}
  line=${line//'${{ github.event.action }}'/$action}
  line=${line//"\${{ github.event.label.name == 'owner-approved' }}"/$approval}
  line=${line//'${{ github.event.pull_request.head.sha }}'/$head}
  line=${line//'${{ github.event.sender.login }}'/$by}
  case $line in *'${{'*) echo "test: unrendered run-name: $line" >&2; exit 2 ;; esac
  printf '%s' "$line"
}

run_json() { # id number event created_at title
  jq -n --argjson id "$1" --argjson n "$2" --arg ev "$3" --arg at "$4" --arg t "$5" \
    '{id: $id, run_number: $n, event: $ev, created_at: $at, display_title: $t}'
}

serve() { cat > "$dir/$(printf '%s' "$1" | tr -c 'A-Za-z0-9' _)"; }

compare() { # range status file...
  local range=$1 status=$2
  shift 2
  jq -n --arg s "$status" '{status: $s, files: [$ARGS.positional[] | {filename: .}]}' --args "$@" \
    | serve "repos/$repo/compare/$range"
}

events() { # (event actor created_at)...
  local out='[]'
  while [ $# -gt 0 ]; do
    out=$(jq -c --arg e "$1" --arg a "$2" --arg t "$3" \
      '. + [{id: (length + 1), event: $e, actor: {login: $a}, label: {name: "owner-approved"}, created_at: $t}]' <<< "$out")
    shift 3
  done
  serve "repos/$repo/issues/$pr/events?per_page=100" <<< "$out"
}

runs() { # run json lines on stdin
  jq -s '{total_count: length, workflow_runs: .}' | serve "repos/$repo/actions/workflows/owner-gate.yml/runs?per_page=100"
}

self_run() { serve "repos/$repo/actions/runs/$self_id"; }

new_case() {
  dir="$tmp/$1"
  mkdir -p "$dir"
  head=$2
  runs < /dev/null
  run_json "$self_id" 50 pull_request_target 2026-11-12T10:00:00Z "$(title synchronize '' "$head" "$triage")" | self_run
  events
}

passed=0
failed=0
expect() { # name pass|fail summary-substring [FAKE_GH_FAIL pattern]
  local name=$1 want=$2 needle=$3 got=pass out
  : > "$dir/summary"
  if ! out=$(cd "$root" && PATH="$tmp/bin:$PATH" FAKE_GH_DIR="$dir" FAKE_GH_FAIL="${4:-}" REPO=$repo PR=$pr \
    BASE_REF=main HEAD_SHA=$head GITHUB_RUN_ID=$self_id GITHUB_STEP_SUMMARY="$dir/summary" GH_TOKEN=unused \
    bash .github/owner-gate/gate.sh 2>&1); then
    got=fail
  fi
  if [ "$got" = "$want" ] && grep -qF -- "$needle" "$dir/summary"; then
    passed=$((passed + 1))
    printf 'ok    %-58s %s: %s\n' "$name" "$got" "$(grep -F -- "$needle" "$dir/summary" | head -1)"
  else
    failed=$((failed + 1))
    printf 'FAIL  %-58s want %s, got %s\n%s\n--- summary\n%s\n' "$name" "$want" "$got" "$out" "$(cat "$dir/summary")"
  fi
}

new_case unlisted "$A"
compare "main...$A" ahead packages/miniapp/src/index.ts
expect "only unlisted files changed" pass "No changed file is on the owner list."

new_case no-label "$A"
compare "main...$A" ahead .github/workflows/ci.yml packages/miniapp/src/index.ts
expect "listed file, no label" fail "has no \`owner-approved\` label"

new_case owner-on-head "$A"
compare "main...$A" ahead .github/workflows/ci.yml
events labeled "$owner" 2026-11-12T10:00:00Z
run_json "$self_id" 50 pull_request_target 2026-11-12T10:00:03Z "$(title labeled owner-approved "$A" "$owner")" | self_run
expect "listed file, owner labels the current head" pass "approved by @$owner at $A"

new_case triage-label "$A"
compare "main...$A" ahead .github/workflows/ci.yml
events labeled "$triage" 2026-11-12T10:00:00Z
run_json "$self_id" 50 pull_request_target 2026-11-12T10:00:03Z "$(title labeled owner-approved "$A" "$triage")" | self_run
expect "label by a triage user not on the owner list" fail "added by @$triage, who is not on"

new_case relabel-by-triage "$A"
compare "main...$A" ahead .github/workflows/ci.yml
events labeled "$owner" 2026-11-12T10:00:00Z unlabeled "$triage" 2026-11-12T10:01:00Z labeled "$triage" 2026-11-12T10:02:00Z
{
  run_json 41 41 pull_request_target 2026-11-12T10:00:03Z "$(title labeled owner-approved "$A" "$owner")"
  run_json 42 42 pull_request_target 2026-11-12T10:01:03Z "$(title unlabeled owner-approved "$A" "$triage")"
} | runs
expect "owner label removed and re-added by a triage user" fail "added by @$triage, who is not on"

# Pull request history for the next cases: the owner approved at A, then pushes moved the head on.
approved_at_A() {
  new_case "$1" "$2"
  compare "main...$2" ahead .github/workflows/ci.yml packages/miniapp/src/index.ts
  events labeled "$owner" 2026-11-12T10:00:00Z
  run_json 41 41 pull_request_target 2026-11-12T10:00:03Z "$(title labeled owner-approved "$A" "$owner")" | runs
}

approved_at_A unlisted-push "$B"
compare "$A...$B" ahead packages/miniapp/src/index.ts
expect "approved at A, push B adds an unlisted file" pass "approved by @$owner at $A"

approved_at_A listed-push "$B"
compare "$A...$B" ahead scripts/publish.mjs
expect "approved at A, push B changes a listed file, label kept" fail "changed after @$owner approved $A"

approved_at_A listed-then-unlisted "$C"
compare "$A...$C" ahead scripts/publish.mjs packages/miniapp/src/index.ts
expect "approved at A, listed push B then unlisted push C" fail "changed after @$owner approved $A"

approved_at_A force-push-diverged "$D"
compare "$A...$D" diverged .github/workflows/ci.yml
expect "approved at A, force-push D, A not an ancestor" fail "not a descendant of $A"

approved_at_A force-push-gone "$D"
expect "approved at A, force-push D, A unknown to the API" fail "compare/$A...$D\` failed"

approved_at_A force-push-back "$C"
compare "$A...$C" behind
expect "approved at A, head reset to an ancestor of A" fail "compare status: behind"

approved_at_A big-since "$B"
compare "$A...$B" ahead "${three_hundred[@]}"
expect "approved at A, compare since lists 300 files" fail "lists 300 files"

approved_at_A unlabeled "$B"
compare "$A...$B" ahead packages/miniapp/src/index.ts
events labeled "$owner" 2026-11-12T10:00:00Z unlabeled "$owner" 2026-11-12T10:05:00Z
expect "approved at A, then the label removed" fail "last removed, by @$owner"

approved_at_A stale-record "$B"
compare "$A...$B" ahead packages/miniapp/src/index.ts
events labeled "$owner" 2026-11-12T10:00:00Z unlabeled "$owner" 2026-11-12T10:05:00Z labeled "$owner" 2026-11-12T10:06:00Z
expect "owner re-labels, but only the older label run exists" fail "is not the run for the latest label event"

approved_at_A other-pr-record "$B"
compare "$A...$B" ahead packages/miniapp/src/index.ts
title labeled owner-approved "$A" "$owner" | sed "s/pr=$pr /pr=8 /" > "$dir/t"
run_json 41 41 pull_request_target 2026-11-12T10:00:03Z "$(cat "$dir/t")" | runs
expect "approval record names another pull request" fail "No run of this workflow recorded"

approved_at_A not-pull-request-target "$B"
compare "$A...$B" ahead packages/miniapp/src/index.ts
run_json 41 41 push 2026-11-12T10:00:03Z "$(title labeled owner-approved "$A" "$owner")" | runs
expect "approval-shaped name on a run that is not pull_request_target" fail "No run of this workflow recorded"

approved_at_A big-pull "$B"
compare "main...$B" ahead "${three_hundred[@]}"
expect "pull request compare lists 300 files" fail "lists 300 files"

approved_at_A garbled-events "$B"
compare "$A...$B" ahead packages/miniapp/src/index.ts
serve "repos/$repo/issues/$pr/events?per_page=100" <<< '<html>rate limited</html>'
expect "API answers with something that is not JSON" fail "stopped on an unexpected error"

n=0
for endpoint in "repos/$repo/compare/main...*" "repos/$repo/issues/*" "repos/$repo/actions/workflows/*" \
  "repos/$repo/actions/runs/*" "repos/$repo/compare/$A...*"; do
  n=$((n + 1))
  approved_at_A "api-down-$n" "$B"
  compare "$A...$B" ahead packages/miniapp/src/index.ts
  expect "API failure on $endpoint" fail "failed." "$endpoint"
done

echo "$passed passed, $failed failed"
[ "$failed" -eq 0 ]
