# ESKARA home example

The home page of the ESKARA 2026 festival guide, a miniapp that ran inside the skkuverse app, on the published `@skkuverse/miniapp` and `@skkuverse/ui`.
It runs in a plain browser, and each tap sends the SDK call it sent in the app.

[Open the live demo](https://spencer0124.github.io/skkuverse-miniapp/examples/eskara-home/), which the docs site serves as static files. To run it here instead:

```sh
npm ci
npm run dev
```

## What it shows

- `src/main.tsx` installs the fake host from `@skkuverse/miniapp/testing` before the page renders, then mounts the page inside a phone frame.
  The host grants every miniapp method, so `isInApp()` is true and the page takes the code path it takes in the app.
- A tap on a row runs `tapRow` in `src/Home.tsx`. It sends `haptic.impact`, then the row's action.
  A page row sends `link.open` with the page's universal link, and the map row sends `map.openPlace` with a place id.
- The panel beside the frame lists every message, as `host.log` records them, and acts each one out on the frame.
  `haptic.impact` shakes the frame, `link.open` opens a sheet titled with the page's name, and `map.openPlace` opens a map card.
  The real app draws something different, and what you see here is only the demo's stand-in for it.
  `examples/shared/host-panel.ts` draws the panel, and `src/panel.ts` says what each sheet shows.
- The lineup strip shows each act's name and day on a plain tile. The official artist images, the festival maps and the inbox feed are left out of the demo.
- `?host=none` leaves the fake host out. A tap then only tries a haptic tick, which does nothing in a plain browser, and the map row is not drawn because no app grants a map. The panel says no host is installed.

The example pins exact versions in `package-lock.json`. It is not a workspace package, so `pnpm install` at the repository root leaves it alone. The docs site's build runs `npm ci`, `npm test` and `npm run build` here, through `packages/site/scripts/build-examples.mjs`.
