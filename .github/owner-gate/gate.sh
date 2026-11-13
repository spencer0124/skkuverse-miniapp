#!/usr/bin/env bash
# The owner gate's decision, run by workflows/owner-gate.yml from main's checkout. It reads the lists from the
# working directory and everything else through `gh api`, and judges HEAD_SHA, the commit its check run attaches to.
# Env: REPO, PR, BASE_REF, HEAD_SHA, GITHUB_RUN_ID, GITHUB_STEP_SUMMARY, GH_TOKEN. Test: .github/owner-gate/test.sh.
set -Eeuo pipefail

label=owner-approved
workflow=owner-gate.yml
work=$(mktemp -d)
: > "$work/matches"

report() { printf '%s\n' "$@" >> "$GITHUB_STEP_SUMMARY"; }

bullets() {
  local line
  while IFS= read -r line; do printf -- '- \x60%s\x60\n' "$line"; done
}

fail() {
  report "### owner-gate failed" "" "$1"
  if [ -s "$work/matches" ]; then
    report "" "Listed files the pull request changes:"
    bullets < "$work/matches" >> "$GITHUB_STEP_SUMMARY"
  fi
  echo "::error::owner-gate failed: $1"
  exit 1
}
trap 'fail "The check stopped on an unexpected error."' ERR

api() {
  local out=$1 path=$2
  shift 2
  gh api "$path" "$@" > "$out" || fail "The GitHub API call \`$path\` failed."
}

entries() {
  [ -r "$1" ] || fail "The list $1 is missing."
  grep -v -e '^[[:space:]]*#' -e '^[[:space:]]*$' "$1" || true
}

matching() {
  local name pattern
  while IFS= read -r name; do
    [ -n "$name" ] || continue
    while IFS= read -r pattern; do
      # shellcheck disable=SC2053
      if [[ "$name" == $pattern ]]; then printf '%s\n' "$name"; break; fi
    done < "$work/patterns"
  done | sort -u
}

# Writes the listed files a compare touches, old names of renames included. GitHub lists at most 300 files.
listed_in_compare() {
  local listed
  listed=$(jq '.files | length' "$1")
  if [ "$listed" -ge 300 ]; then
    fail "The compare $2 lists $listed files, the most GitHub returns, so the check cannot see every file."
  fi
  jq -r '.files[] | .filename, (.previous_filename // empty)' "$1" > "$work/names"
  matching < "$work/names" > "$3"
}

lower() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]'; }

entries .github/owner-gate-paths > "$work/patterns"
entries .github/owner-gate-owners > "$work/owners"

api "$work/pull.json" "repos/$REPO/compare/$BASE_REF...$HEAD_SHA"
listed_in_compare "$work/pull.json" "$BASE_REF...$HEAD_SHA" "$work/matches"
if [ ! -s "$work/matches" ]; then
  report "No changed file is on the owner list."
  exit 0
fi

api "$work/events.json" "repos/$REPO/issues/$PR/events?per_page=100" --paginate
jq -rs --arg label "$label" '
  [(add // [])[] | select((.event == "labeled" or .event == "unlabeled") and (.label.name // "" | ascii_downcase) == $label)]
  | last // empty | [.event, .actor.login, .created_at] | @tsv
' "$work/events.json" > "$work/event"
IFS=$'\t' read -r event actor event_at < "$work/event" || fail "The pull request has no \`$label\` label."
if [ "$event" != labeled ]; then
  fail "The \`$label\` label was last removed, by @$actor."
fi
if ! grep -qixF -- "$actor" "$work/owners"; then
  fail "The \`$label\` label was added by @$actor, who is not on .github/owner-gate-owners."
fi

# The approval record is the run-name of the run GitHub started for the label event (see the workflow's WHY).
api "$work/runs.json" "repos/$REPO/actions/workflows/$workflow/runs?per_page=100" --paginate
api "$work/self.json" "repos/$REPO/actions/runs/$GITHUB_RUN_ID"
jq -rn --slurpfile pages "$work/runs.json" --slurpfile self "$work/self.json" --arg pr "$PR" '
  [$pages[].workflow_runs[], $self[]]
  | map(select(.event == "pull_request_target") | . as $run
      | (.display_title // "")
      | capture("^owner-gate pr=(?<pr>[0-9]+) (?<action>labeled|unlabeled) approval=true head=(?<head>[0-9a-f]{40}) by=(?<by>[A-Za-z0-9-]+)$")
      | . + {id: $run.id, number: $run.run_number, created_at: $run.created_at})
  | map(select(.pr == $pr)) | unique_by(.id) | sort_by(.number)
  | last // empty | [.action, .by, .head, .created_at] | @tsv
' > "$work/record"
IFS=$'\t' read -r run_action run_by approved run_at < "$work/record" \
  || fail "No run of this workflow recorded the head the \`$label\` label was added at. Remove the label and add it again."
if [ "$run_action" != labeled ] || [ "$(lower "$run_by")" != "$(lower "$actor")" ] || [[ "$run_at" < "$event_at" ]]; then
  fail "The latest label run ($run_action by @$run_by at $run_at) is not the run for the latest label event (labeled by @$actor at $event_at). Remove the label and add it again."
fi

if [ "$approved" != "$HEAD_SHA" ]; then
  api "$work/since.json" "repos/$REPO/compare/$approved...$HEAD_SHA"
  status=$(jq -r '.status' "$work/since.json")
  if [ "$status" != ahead ]; then
    fail "The head $HEAD_SHA is not a descendant of $approved, the head @$actor approved (compare status: $status). Remove the label and add it again."
  fi
  listed_in_compare "$work/since.json" "$approved...$HEAD_SHA" "$work/since"
  if [ -s "$work/since" ]; then
    report "Listed files changed since the approval at $approved:"
    bullets < "$work/since" >> "$GITHUB_STEP_SUMMARY"
    fail "A listed file changed after @$actor approved $approved. Remove the label and add it again."
  fi
fi

report "Files on the owner list, approved by @$actor at $approved, with no listed file changed since:"
bullets < "$work/matches" >> "$GITHUB_STEP_SUMMARY"
