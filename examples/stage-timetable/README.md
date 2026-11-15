# Stage timetable example

A small miniapp on the published `@skkuverse/miniapp` and `@skkuverse/ui`, which runs in a plain browser.
It is shaped like a festival stage timetable, and its acts are made up.

[Open it in StackBlitz](https://stackblitz.com/github/spencer0124/skkuverse-miniapp/tree/main/examples/stage-timetable?file=src%2FApp.tsx). The first visit can take a few minutes, because StackBlitz clones the repository and installs the packages. To run it here instead:

```sh
npm ci
npm run dev
```

## What it shows

- `src/main.tsx` installs the fake host from `@skkuverse/miniapp/testing` before the page renders.
  The fake host runs the app's real bootstrap script, so `isInApp()` is true and the page takes the code path it takes inside the app.
- Each tap on Star or Share sends a bridge message, and the panel at the bottom lists every message the fake host received.
  A test reads the same record from `host.log`.
- `?host=none` leaves the fake host out. The page then runs as it would in a plain browser: `haptic()` does nothing and `share()` falls back to the browser's share sheet or the clipboard.

The example pins exact versions in `package-lock.json`. It is not a workspace package, so `pnpm install` at the repository root leaves it alone, and CI does not build it.
