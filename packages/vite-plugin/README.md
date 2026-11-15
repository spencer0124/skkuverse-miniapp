# @skkuverse/vite-plugin-miniapp

A Vite plugin that gives `vite dev` a host. A miniapp or game page then runs the
code path it runs inside the skkuverse app, and the terminal shows each message it
sends to the app.

Without it, a page in `vite dev` sits in a plain browser. `window.skkuverse` is
missing, every SDK call takes its fallback, and the page never reaches the code
that the app runs. A page that works in `vite dev` can still break in the app.

`miniapp-cli new` scaffolds a page that already uses it. To add it to an existing page:

```js
// vite.config.ts
import { defineConfig } from 'vite';
import { skkuverseDevHost } from '@skkuverse/vite-plugin-miniapp';

export default defineConfig({
  plugins: [skkuverseDevHost()],
});
```

It needs `vite` 6.4 or later, including 7 and 8. The host runs the app's real
bootstrap script from `@skkuverse/miniapp/protocol` and takes its presets from
`@skkuverse/miniapp/testing`.

The templates name the plugin as `catalog:`. A repository that upgrades
`@skkuverse/miniapp-cli` and runs `new` needs the plugin in its
`pnpm-workspace.yaml` catalog first, or `pnpm install` fails with
`ERR_PNPM_CATALOG_ENTRY_NOT_FOUND_FOR_SPEC`:

```yaml
catalog:
  "@skkuverse/vite-plugin-miniapp": ^0.1.0
```

## What you see

In `pnpm dev`, the page has no dev banner, `window.skkuverse.protocol` is `1`, and
the terminal prints one line for each message in either direction:

```text
[skkuverse] dev host ready, preset granted. Page messages print here.
[skkuverse] dev host installed, preset granted {"capabilities":["haptic.impact", ...]}
[skkuverse] page -> host haptic.impact {"style":"light"}
[skkuverse] host -> page viewport.changed {"safeArea":{"top":47, ...}}
```

The app drops a bad message without a word. The dev host throws from `postMessage`
instead, so the page's console and the terminal both name the problem. It throws for
a method it does not handle, a method whose params fail the app's validator, text
that is not a message, and a method the preset does not grant.

## Presets

`SKKUVERSE_PRESET` picks the host state the page meets. The names are the ones
`createFakeHost` takes from `@skkuverse/miniapp/testing`: `granted` (default),
`nothing-granted`, `no-host`, `late-host`, `slow-init` and `old-host:<version>`.

```sh
SKKUVERSE_PRESET=nothing-granted pnpm dev
```

Only `vite dev` reads the variable. An unknown name fails the start and lists the
known ones. The option `preset` sets the default for a repository that wants
another one.

## What the host does

| The page sends | The host does |
| --- | --- |
| `game.ready` | Answers with `game.init` after the preset's delay |
| `shell.set` | Moves the top inset and sends `viewport.changed` when `header` changes |
| Any other method it grants | Prints the line and nothing more |
| A request | Answers `unsupported`, as the app does for a method it does not know |

The host answers after `postMessage` returns, on a microtask, because the app
answers through `injectJavaScript`. A listener the page adds right after a post
still hears the answer.

The app grants a miniapp origin the miniapp methods and a game origin the game
methods, never both. The host does the same: a page with a `public/skkuverse.json`
is a miniapp and gets the preset's miniapp methods, and a page without one is a
game and gets only its game methods.

The top inset follows the shell. A miniapp starts with the `header` in its
`public/skkuverse.json`, which the app reads before it creates the web view, and a
page with no manifest starts `overlay`. An `opaque` header leaves the top edge at
zero, and an `overlay` header applies the preset's insets. This models
[the protocol's shell rules](../../docs/reference/protocol.md); the app itself is
outside this repository.

If a host is already there, such as when the page opens in the real app over the
local network, the plugin installs nothing.

## Options

| Option | Default | Effect |
| --- | --- | --- |
| `preset` | `granted` | The host state. `SKKUVERSE_PRESET` wins in `vite dev` |
| `inject` | `serve` | `always` also emits the host into a build, as a hashed script |
| `host` | `self` | `parent` hands the page's window to `window.parent.__playground.attach(window)` for a page a playground frames |

A default build holds none of the host. The footprint test builds the miniapp
template twice and counts the sentinel `__SKKUVERSE_DEV_HOST__` in `dist/`: zero
by default, and at least one with `inject: 'always'`, which proves the count can
fail. A build made with `inject: 'always'` is for `vite preview` and browser tests
only. `miniapp-cli ship` refuses to stage a build that holds the sentinel, and
names the file.
