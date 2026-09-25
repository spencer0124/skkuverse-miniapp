# Changesets

Every change that should reach the miniapps needs a changeset: run
`pnpm changeset`, pick the packages and the bump, and commit the generated
file with the change. Merging to `main` opens a "Version Packages" PR; merging
that PR publishes to npm.
