---
title: Distribute The Miniapp SDK And SDS As Public npm Packages
type: adr
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-09-25
audience: public
---

# ADR 0001 — Distribute the miniapp SDK and SDS as public npm packages

> Six miniapps each carried their own copy of the design system and the bridge contract. They now import three packages from this repository instead, published to public npm.

## Status

accepted (2026-09-25)

## Context

By the sixth miniapp, every repository carried `packages/{tokens,ui,bridge}` plus an
`apps/webview/src/bridge.ts` of helpers. The copies came from `skkuverse-web`, which holds
hash-checked copies of the app's files, but the miniapps' copies were checked by nothing:

- `bridge/src/types.ts` had already split. Three miniapps lacked `appUrl`, and
  `skkuverse-web` lacked both `appUrl` and `web:action`.
- `bridge.ts` existed in four different subsets: map helpers, link helpers, haptics with a
  vibration fallback, or nothing at all.
- The upcoming work (rewarded ads, sign-in, launch tokens) would have multiplied the
  helpers across every repository.

The miniapp repositories are separate Cloudflare Pages projects, most of them private, and
the build must install without credentials.

## Decision

**One repository, `spencer0124/skkuverse-miniapp`, publishes three packages to public npm:**

| Package | Holds |
| --- | --- |
| `@skkuverse/tokens` | Design tokens. The four token files are hash-checked copies of the app's, and `css.ts` adapts them for the browser |
| `@skkuverse/ui` | The web port of the SKKU Design System: providers and components |
| `@skkuverse/miniapp` | The bridge protocol (`/protocol`), the SDK (`.`), and React bindings (`/react`) |

- **The bridge protocol's source of truth moves here.** `packages/miniapp/src/protocol/`
  has no DOM, React or dependencies, and the app and skkuverse-server import it from
  npm rather than copying it. Since 0.2.0 the miniapp channel has its own envelope,
  with requests, responses and events. skkuverse-web keeps the older
  `@skkuverse/bridge` messages on the app's generic `/webview` screen.
- **Built, not raw source.** Each package ships ESM plus declarations built by tsup. Raw
  TypeScript in `node_modules` gets type-checked under every consumer's compiler flags,
  because `skipLibCheck` skips only `.d.ts` files.
- **Public.** Nothing here is secret: all of it ends up in a browser. Public npm lets
  Cloudflare Pages install with no token, which matches the umbrella's no-credentials
  principle from its ADR 0002.
- **Released by Changesets.** Merging to `main` opens a "Version Packages" PR. Merging that
  publishes through npm trusted publishing, so no npm token is stored anywhere.

### Relation to the hosted SDK in the app's ADR 0006

The app's ADR 0006 decision 3 plans a hosted `<script src=".../miniapp-sdk/vN.js">`, so
that old app builds can be shimmed without third-party miniapps rebuilding. That still
holds, and this decision narrows it. **The contract is the wire protocol and the capability
handshake, not a module.** First-party miniapps, which we rebuild ourselves, bundle
`@skkuverse/miniapp` from npm. The hosted script for third parties is built from the same
source: `packages/miniapp` already emits `dist/miniapp-sdk.global.js`, not yet served anywhere.

## Consequences

- ✅ A miniapp's bridge and design code is a dependency line. The scaffold loses `packages/`.
- ✅ Contract drift between miniapps becomes version skew, which is visible in each
  `package.json` and harmless while the protocol changes additively.
- ⚠️ A fix reaches a miniapp only when that miniapp bumps its dependency and redeploys.
  Accepted: every miniapp is rebuilt by us, and the protocol rules make an old SDK against a
  new app safe.
- ⚠️ Publishing needs a one-time manual setup: the npm org, the first publish, and the trusted
  publisher per package.

## Alternatives considered

**GitHub Packages.** Rejected because installs need a token even for public packages, which
means a secret in every Cloudflare Pages project.

**Git dependencies pinned to tags.** Rejected. No registry is needed, but pnpm builds a git
dependency on install, lockfiles pin commits instead of immutable artifacts, and a private
repository would still need a token.

**Keep copying, add the miniapps to the contracts manifest.** Rejected. It would catch drift
in `types.ts` but not in the helpers, and it keeps a design system's worth of files in every
repository.

## Related

- [protocol](../reference/protocol.md) — the messages, the shell manifest, and the viewport
