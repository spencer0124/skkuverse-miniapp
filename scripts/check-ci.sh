#!/usr/bin/env bash
# Usage: check-ci.sh [--skip <step>]...
# WHY: the local push gate passes `--skip test`, because the full suite outlasts a push. CI runs it on every pull
# request.
set -euo pipefail
export CI=true TZ=UTC LANG=C.UTF-8

self=${BASH_SOURCE[0]}
known_steps() { sed -n 's/^step \([^ ]*\) .*/\1/p' "$self" | tr '\n' ' '; }
skip=" "
while [ $# -gt 0 ]; do
  case "$1" in
    --skip)
      name=${2:-}
      case "$name" in "" | *[!a-z0-9-]*) echo "check-ci: --skip needs a step name: $(known_steps)" >&2; exit 2 ;; esac
      if ! grep -q "^step $name " "$self"; then
        echo "check-ci: no step named '$name' to skip; the steps are: $(known_steps)" >&2
        exit 2
      fi
      skip="$skip$name "
      shift 2
      ;;
    *)
      echo "check-ci: unknown argument '$1' (usage: check-ci.sh [--skip <step>]...)" >&2
      exit 2
      ;;
  esac
done

step() {
  local name=$1
  shift
  case "$skip" in *" $name "*) echo "check-ci: skipped $name (--skip $name)"; return 0 ;; esac
  if [ -n "${GITHUB_ACTIONS:-}" ]; then echo "::group::$name"; else echo "check-ci: $name"; fi
  "$@"
  if [ -n "${GITHUB_ACTIONS:-}" ]; then echo "::endgroup::"; fi
}

step install pnpm install --frozen-lockfile
step build pnpm build
step typecheck pnpm typecheck
step test pnpm test
step lint pnpm lint
step lint-md pnpm lint:md
step knip pnpm knip
# WHY: the owner gate's decision script runs only from main, on pull requests to main, so its cases run here, against
# a fake gh, before a change to it can reach main.
step owner-gate bash .github/owner-gate/test.sh
