# Changesets

Every change that should reach the miniapps needs a changeset: run
`pnpm changeset`, pick the packages and the bump, and commit the generated
file with the change. A maintainer later runs `pnpm changeset version` on a
`chore/version-packages` branch cut from `main`, merges it through a PR, and
publishes from `main` with `node scripts/publish.mjs`; see
`docs/how-to/release-packages.md`.
