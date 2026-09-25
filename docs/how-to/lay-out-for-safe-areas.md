---
title: Lay Out For Safe Areas
type: how-to
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-09-26
audience: internal
---

# Lay out for safe areas

> Keeping a miniapp page clear of the status bar, the notch, the home indicator and the app's own header and bar, while its background still runs edge to edge. For anyone laying out a page.

## Overview

The app injects the insets as CSS variables on `<html>` before the page loads, and keeps them current:

| Variable | Covers |
| --- | --- |
| `--sv-safe-{top,bottom,left,right}` | The device: status bar, notch, home indicator |
| `--sv-content-{top,bottom,left,right}` | The app's own header and bottom bar |
| `--sv-inset-{top,bottom,left,right}` | Both, summed. This is the one to use |

`html[data-sv-chrome]` is `glass` on iOS 26 and later, where the app's header and bar are translucent, and `opaque` elsewhere. Outside the app, `MiniappRoot` sets the insets to the browser's `env(safe-area-inset-*)`, so the same CSS works in a browser too.

Do not use `env(safe-area-inset-*)` directly. It reads zero on recent Android WebViews, and it cannot see the app's bar.

## Prerequisites

- The page renders inside `MiniappRoot`.
- `index.html` has `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`. The app does not need it, but a browser does.

## Steps

1. **Paint the background edge to edge.** Put the page colour on `body` or on a full-height root, not on a padded container.
2. **Pad content by the insets.**

   ```css
   .page {
     padding-top: calc(var(--sv-inset-top) + 16px);
     padding-bottom: calc(var(--sv-inset-bottom) + 16px);
   }
   ```

3. **Pad anything fixed to an edge.**

   ```css
   .bottom-cta {
     position: fixed;
     inset: auto 0 0;
     padding-bottom: max(16px, var(--sv-inset-bottom));
   }
   ```

   SDS's `BottomCTA`, `BottomSheet` and `Toast` already do this, from `@skkuverse/ui` 0.1.1.
4. **Choose the top from the shell.** With `header: opaque` in `public/skkuverse.json` the page starts below the header and `--sv-inset-top` is 0. With `header: overlay` the page starts at the top of the screen:
   - On `glass`, paint something worth seeing up there, because the header blurs it.
   - On `opaque`, the header's buttons float on your page, so keep that band plain.
5. **Follow changes in JavaScript layouts.** Canvas games and other JS layouts read `getViewport()` or `useViewport()` and follow `viewport.changed`. CSS variables update on their own.
6. **Check it.** Pass `mockViewport` to `MiniappRoot` in development to see a phone-shaped inset on the desktop:

   ```tsx
   <MiniappRoot id="mukja" dev={import.meta.env.DEV} mockViewport={{
     safeArea: { top: 47, bottom: 34, left: 0, right: 0 },
     contentSafeArea: { top: 0, bottom: 66, left: 0, right: 0 },
     chrome: 'glass',
   }}>
   ```

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Content under the home indicator in the app | Padding with `env()` or a fixed number | `var(--sv-inset-bottom)` |
| Double space at the bottom while typing | The page also sizes itself to `visualViewport`, which already excludes the keyboard | Drop the bottom inset while the keyboard covers that edge |
| A strip of the wrong colour when overscrolling or loading | `shell.background` does not match the page | Set `background` in `public/skkuverse.json` to the page colour |

## Related

- [protocol](../reference/protocol.md#viewport-and-safe-areas) — the viewport model
- [0002-miniapp-protocol-shell-viewport](../decisions/0002-miniapp-protocol-shell-viewport.md) — why injected rather than `env()`
