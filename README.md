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
import { MiniappRoot } from '@skkuverse/miniapp/react';
import { MapButton } from '@skkuverse/miniapp/react/ui';
```

Documentation is indexed in [docs/README.md](docs/README.md). Start with:

- [explanation/architecture.md](docs/explanation/architecture.md), for how the packages, the app and the server fit
- [reference/protocol.md](docs/reference/protocol.md), for the contract with the app
- [how-to/create-a-miniapp.md](docs/how-to/create-a-miniapp.md), for building a new miniapp

## Developing

```sh
pnpm install
pnpm build && pnpm typecheck && pnpm test && pnpm lint && pnpm lint:md
```

To try a change in a miniapp before releasing it, build here, then in the miniapp run
`pnpm link ../../skkuverse-miniapp/packages/<name>`. Never commit the link.

## Releasing

Add a changeset with each change (`pnpm changeset`). Merging to `main` opens a "Version
Packages" PR. After merging it, publish locally with `node scripts/publish.mjs`: CI cannot
publish yet ([npm/cli#9969](https://github.com/npm/cli/issues/9969)). The whole procedure is in
[how-to/release-packages.md](docs/how-to/release-packages.md).

## License

Apache-2.0
