---
title: Create A Miniapp
type: how-to
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-09-26
audience: internal
---

# Create a miniapp

> Every step from an empty folder to a miniapp tile in the skkuverse app: scaffold, repository, Cloudflare Pages, custom domain, server registry, production. For whoever adds the next one.

## Overview

| # | Step | Where | Result |
| --- | --- | --- | --- |
| 1 | Pick a name | — | `<name>` = folder = repo suffix = subdomain = registry id |
| 2 | Scaffold | `miniapp/<name>/` | `pnpm dev` runs locally |
| 3 | GitHub repository | `spencer0124/miniapp-<name>` | `main` and `dev` branches |
| 4 | Cloudflare Pages | Cloudflare API | a push to `main` deploys |
| 5 | Custom domain | Cloudflare API and DNS | `https://<name>.mini.skkuverse.com` |
| 6 | Server registry | skkuverse-server `dev` | the app knows the miniapp |
| 7 | Production | server `dev → main` | a tile on the app's home grid |

The app needs no release: its home grid and the mini-app shell both read the server registry.

## Prerequisites

- Node 22 and pnpm 11.20.0, which `.nvmrc` and `packageManager` pin.
- Wrangler logged in (`npx wrangler@latest whoami`), for its OAuth token.
- Push access to skkuverse-server.
- A checkout of an existing miniapp to copy. mukja is the smallest current one.

## Steps

### 1. Pick a name

- Use lowercase letters, digits and hyphens only (`^[a-z0-9-]+$`). The server checks this at boot.
- The one name is the folder, the repository (`miniapp-<name>`), the Pages project, the subdomain and the registry id. It is hard to change later, because deep links (`/m/<id>`), analytics ids and cache keys all use it.
- Avoid infrastructure labels: `api`, `media`, `ota`, `files`, `console`, `webview`.
- First-party miniapps live at `<name>.mini.skkuverse.com`. `eskara.miniapp.skkuverse.com` is a legacy exception kept for links already shared, and the server does not fetch its manifest.

### 2. Scaffold

Copy an existing miniapp without its own code:

```sh
cd ~/project/skkuverse/miniapp
rsync -a \
  --exclude node_modules --exclude dist --exclude .turbo --exclude .git \
  --exclude scripts --exclude packages \
  --exclude 'apps/webview/src/pages' --exclude 'apps/webview/src/data' \
  --exclude 'apps/webview/src/lib' \
  mukja/ <name>/
cd <name>
```

Rename:

- Root `package.json`: `"name": "<name>-miniapp"`. In the `dev` and `preview` scripts, change `--filter @skkuverse/mukja-webview` to `@skkuverse/<name>-webview`. Remove scripts the new miniapp does not have.
- `apps/webview/package.json`: `"name": "@skkuverse/<name>-webview"`.
- `apps/webview/index.html`: `<title>`.
- `README.md`: write a new one.

Wire the SDK:

- **Dependencies.** `apps/webview/package.json` depends on `@skkuverse/miniapp` and, when the page uses SDS components, `@skkuverse/ui`. Check the current versions with `npm view @skkuverse/miniapp version`. `pnpm-workspace.yaml` lists only `apps/*` and carries `minimumReleaseAgeExclude: ['@skkuverse/*']`, so a fresh release installs.
- **Root.** `apps/webview/src/main.tsx` renders the app inside `<MiniappRoot id="<name>" dev={import.meta.env.DEV}>`, around any `SDSProvider`. It blocks plain browsers. Add `browser="allow"` only when the page is meant to be shared outside the app.
- **Shell.** `apps/webview/public/skkuverse.json` declares the shell, for example `{"shell":{"bar":"top","header":"opaque","statusBar":"dark","background":"#FFFFFF"}}`. Set `background` to the page's own background colour. See the [shell fields](../reference/protocol.md#shell).
- **Safe areas.** Pad with `var(--sv-inset-*)`. See [lay out for safe areas](lay-out-for-safe-areas.md).

Keep as they are:

- `public/_headers` and `public/_redirects`, which set the Pages cache headers and the SPA fallback.
- `.nvmrc`, `turbo.json` and `tsconfig*`.

Check locally:

```sh
pnpm install
pnpm dev                     # http://localhost:5173, never blocked on localhost
pnpm typecheck && pnpm build
```

`miniapp/` is itself the `miniapp-eskara` repository, so a new folder shows up there as untracked. That is expected: each miniapp is its own repository.

### 3. GitHub repository

```sh
cd ~/project/skkuverse/miniapp/<name>
gh repo create spencer0124/miniapp-<name> --private

cat > .gitignore <<'EOF'
node_modules/
dist/
.turbo/
.env
.env.local
.env.*.local
.DS_Store
EOF

pnpm install --frozen-lockfile && pnpm build   # the same conditions as Cloudflare
git init -b main
git add -A
git commit -m "Add the <name> miniapp"
git remote add origin https://github.com/spencer0124/miniapp-<name>.git
git push -u origin main
git branch dev && git push -u origin dev
git checkout dev
```

`main` is production and `dev` is the working branch, which deploys as a Pages preview.

### 4. Cloudflare Pages

`wrangler pages project create` only makes Direct Upload projects, so a GitHub-connected project goes through the Cloudflare REST API, using the Wrangler login token. The Cloudflare GitHub app must be able to see the new repository.

```sh
TOKEN=$(grep '^oauth_token' ~/Library/Preferences/.wrangler/config/default.toml | cut -d'"' -f2)
ACC=a59091bcc7d7fb75086facd0d5c44897
API=https://api.cloudflare.com/client/v4

curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "$API/accounts/$ACC/pages/projects" -d '{
  "name": "miniapp-<name>",
  "production_branch": "main",
  "source": {"type": "github", "config": {
    "owner": "spencer0124", "repo_name": "miniapp-<name>", "production_branch": "main",
    "pr_comments_enabled": true, "deployments_enabled": true,
    "production_deployments_enabled": true, "preview_deployment_setting": "all",
    "preview_branch_includes": ["*"], "preview_branch_excludes": []}},
  "build_config": {"build_command": "pnpm build", "destination_dir": "apps/webview/dist", "root_dir": ""},
  "deployment_configs": {
    "production": {"build_image_major_version": 3, "env_vars": {"PNPM_VERSION": {"type": "plain_text", "value": "11.20.0"}}},
    "preview":    {"build_image_major_version": 3, "env_vars": {"PNPM_VERSION": {"type": "plain_text", "value": "11.20.0"}}}
  }}'
```

`PNPM_VERSION` is required. Without it the build image uses another pnpm and can disagree with the lockfile. The first build does not start on its own:

```sh
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  "$API/accounts/$ACC/pages/projects/miniapp-<name>/deployments" -F branch=main
curl -sI https://miniapp-<name>.pages.dev/     # 200 once latest_stage is "deploy success"
```

### 5. Custom domain

Register the domain on the project through the API:

```sh
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "$API/accounts/$ACC/pages/projects/miniapp-<name>/domains" \
  -d '{"name": "<name>.mini.skkuverse.com"}'
```

The DNS record needs the dashboard, because the Wrangler token has no DNS write scope. Add a CNAME record in the `skkuverse.com` zone with name `<name>.mini`, target `miniapp-<name>.pages.dev`, proxied, TTL Auto. The Aside browser can do it: `aside "Cloudflare dashboard, zone skkuverse.com → DNS → Records: add ONE CNAME record, Name '<name>.mini', Target 'miniapp-<name>.pages.dev', Proxied, TTL Auto. Do not modify any other record."`

Then re-validate and check:

```sh
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" \
  "$API/accounts/$ACC/pages/projects/miniapp-<name>/domains/<name>.mini.skkuverse.com"
curl -sI https://<name>.mini.skkuverse.com/                 # 200
curl -s https://<name>.mini.skkuverse.com/skkuverse.json    # the manifest
```

The dashboard's warning icon next to a two-level subdomain can be ignored. Pages issues a certificate per custom host.

### 6. Server registry

Follow skkuverse-server's [register a mini app](https://github.com/spencer0124/skkuverse-server/blob/main/docs/how-to/register-a-miniapp.md), on its `dev` branch. In short:

1. Add an entry to `src/miniapps/index.json` and create `src/miniapps/details/<name>.json`.
2. Add the details file to `scripts/copy-build-assets.js`. Forgetting it crashes production only.
3. Add the origin to `BRIDGE_ORIGINS` in `src/infra/origins.ts`. The app grants SDK methods only to those origins, and without it every button silently does nothing. Update the literal list in the app-config test too.
4. Leave `shell` out of the details file. The page's own manifest decides it.

### 7. Production

Merge skkuverse-server `dev` into `main` through a PR, since only `main` deploys. Then check:

```sh
curl -s https://api.skkuverse.com/miniapps/<name>    # 200, with the page's shell merged in
curl -s https://api.skkuverse.com/app/config         # data.webview.bridgeOrigins has the origin
```

The app caches `/miniapps` for five minutes, so restart it if the tile is missing.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| The page shows "스꾸버스 앱에서 열어 주세요" inside the app | The installed app predates the 0.2 shell, so there is no `window.skkuverse` | Ship the app's OTA before merging the miniapp to production <!-- conventions:allow-korean: the gate's product copy --> |
| Buttons do nothing in the app | The origin is missing from `BRIDGE_ORIGINS`, or is misspelled | `https://`, no trailing `/`, exact subdomain |
| Content sits under the home indicator or the bottom bar | The page pads with `env()` or not at all | Use `var(--sv-inset-bottom)` |
| A shell change does not show | Caches | Wait about ten minutes: five on the server, five in the app |
| A just-published `@skkuverse/*` will not install | pnpm's `minimumReleaseAge` | `minimumReleaseAgeExclude: ['@skkuverse/*']` |
| The same, with `404` from the registry | npm's install metadata lags a few minutes after a publish | Wait, then retry |
| The Pages build uses the wrong pnpm | `PNPM_VERSION` is unset | Set it on both environments |
| The server crashes at boot in production only | The details file is missing from `copy-build-assets.js` | Add it |
| `index.json` fails at boot | An unknown key, such as `logo` or `homelogo` | Only the documented keys are allowed |

## Related

- [protocol](../reference/protocol.md) — the SDK's contract with the app
- [lay-out-for-safe-areas](lay-out-for-safe-areas.md) — padding with `--sv-inset-*`
- [release-packages](release-packages.md) — when the miniapp needs a new SDK feature
- [architecture](../explanation/architecture.md) — how the pieces fit
