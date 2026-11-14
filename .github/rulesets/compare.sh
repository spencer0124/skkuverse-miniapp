#!/usr/bin/env bash
# Usage: compare.sh <owner>/<repo> [--keep-bypass | --write]
#   (no flag)      compare without bypass_actors
#   --keep-bypass  compare bypass_actors too
#   --write        write each live ruleset into <name>.json, bypass_actors included
# WHY: GitHub returns bypass_actors only to a token with write access to the ruleset, which a workflow token lacks,
# so the default compare drops them on both sides. --keep-bypass and --write need a repository admin's token.
set -euo pipefail

usage() {
  echo "usage: compare.sh <owner>/<repo> [--keep-bypass | --write]" >&2
  exit 2
}
[ $# -ge 1 ] && [ $# -le 2 ] || usage
repo=$1 mode=${2:-}
case "$repo" in */*) ;; *) usage ;; esac
case "$mode" in "" | --keep-bypass | --write) ;; *) usage ;; esac
dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

drop='del(.id, .node_id, .created_at, .updated_at, ._links, .current_user_can_bypass)'
[ -z "$mode" ] && drop="$drop | del(.bypass_actors)"

live=$(gh api "repos/$repo/rulesets?includes_parents=false" --paginate --jq '.[].id' | while read -r id; do
  gh api "repos/$repo/rulesets/$id" || exit 1
done | jq -S -s "map($drop)")

if [ "$mode" = --write ]; then
  while IFS= read -r name; do
    jq -S --arg name "$name" '.[] | select(.name == $name)' <<<"$live" >"$dir/$name.json"
    echo "compare.sh: wrote $name.json"
  done < <(jq -r '.[].name' <<<"$live")
  exit 0
fi

by_name="map($drop) | map({key: .name, value: .}) | from_entries"
if ! diff -u --label files --label live <(cat "$dir"/*.json | jq -S -s "$by_name") <(jq -S "$by_name" <<<"$live"); then
  echo "compare.sh: the live rulesets of $repo differ from .github/rulesets (- files, + live)." >&2
  echo "Change the ruleset back, or export it with compare.sh $repo --write and an admin's token." >&2
  exit 1
fi
echo "compare.sh: the $(jq length <<<"$live") live rulesets of $repo match .github/rulesets${mode:+ ($mode)}"
