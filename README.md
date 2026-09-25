# skkuverse-miniapp

The shared code every skkuverse miniapp imports: the web design system and the SDK
for talking to the skkuverse app.

| Package | What it is |
| --- | --- |
| [`@skkuverse/ui`](packages/ui) | SKKU Design System for the web: `SDSProvider` and components |
| [`@skkuverse/tokens`](packages/tokens) | Design tokens, copied from the app and hash-checked |
| [`@skkuverse/miniapp`](packages/miniapp) | Bridge protocol, SDK and React bindings |

```tsx
import { SDSProvider, Button } from '@skkuverse/ui';
import { haptic, openUrl } from '@skkuverse/miniapp';
import { MapButton } from '@skkuverse/miniapp/react';
```

- [docs/reference/protocol.md](docs/reference/protocol.md) covers the messages, the rules both sides follow, and
  the reserved v2 for ads, sign-in and launch tokens.
- [docs/decisions/0001-sdk-distribution.md](docs/decisions/0001-sdk-distribution.md) explains why this is an npm
  package.

## Developing

```sh
pnpm install
pnpm build && pnpm typecheck && pnpm test && pnpm lint
```

To try a change in a miniapp before releasing it, build here, then in the miniapp run
`pnpm link ../../skkuverse-miniapp/packages/<name>`. Never commit the link.

## Releasing

1. Add a changeset with the change: `pnpm changeset`.
2. Merge to `main`. The release workflow opens a "Version Packages" PR.
3. Merge that PR, then publish from a local checkout of `main`:
   `pnpm install && pnpm build && node scripts/publish.mjs`. It publishes only
   versions npm does not have, in dependency order, and asks for 2FA once.
4. Bump the dependency in each miniapp that needs the change.

CI does not publish for now. npm trusted publishing rejects this repository's OIDC
tokens, because repositories created after 2026-07-15 get GitHub's immutable
`sub` claim format, which npm does not match yet
([npm/cli#9969](https://github.com/npm/cli/issues/9969)). When that is fixed, add
`publish: pnpm release` back to the changesets step in `release.yml`.

`packages/miniapp/src/protocol/` is the contract with the app. Add methods there first,
then release the SDK before the app. A page detects each method in `getCapabilities()`, so
a page on a newer SDK still runs on an older app.

## License

Apache-2.0
