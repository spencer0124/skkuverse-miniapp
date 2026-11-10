# __ID__

What this miniapp is for, in one or two sentences.

```sh
pnpm --filter ./apps/__ID__ dev        # → http://localhost:5173
pnpm check __ID__                      # after a build
pnpm ship __ID__ --preview
```

## Data

Where the content comes from, and how to refresh it.

## Deployment

`pnpm ship __ID__` from a clean `main`. The Pages project and host are in the
root `deploy.config.json`. To list the miniapp in the app, ask the platform
maintainers to register it.
