---
title: "@skkuverse/miniapp/protocol"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# @skkuverse/miniapp/protocol

## Interfaces

- [GameHostEvents](interfaces/GameHostEvents.md)
- [GameInit](interfaces/GameInit.md)
- [GameNotifyMethods](interfaces/GameNotifyMethods.md)
- [GameOver](interfaces/GameOver.md)
- [GameRect](interfaces/GameRect.md)
- [HostBootstrapOptions](interfaces/HostBootstrapOptions.md)
- [HostEvents](interfaces/HostEvents.md)
- [HostGlobal](interfaces/HostGlobal.md)
- [Manifest](interfaces/Manifest.md)
- [MiniappNotifyMethods](interfaces/MiniappNotifyMethods.md)
- [NotifyMethods](interfaces/NotifyMethods.md)
- [ProtocolError](interfaces/ProtocolError.md)
- [Request](interfaces/Request.md)
- [RequestMethods](interfaces/RequestMethods.md)

## Type Aliases

### ErrorCode

> **ErrorCode** = `"unsupported"` \| `"denied"` \| `"cancelled"` \| `"timeout"` \| `"failed"`

The miniapp ↔ app contract, and nothing else: no DOM at import time, no
React, no dependencies. The app imports it for the parser and the scripts it
injects, skkuverse-server for the manifest parser, and the SDK for the types.

Messages are in `messages.ts`, the shell manifest in `manifest.ts`, safe
areas in `viewport.ts`, and the injected `window.skkuverse` in `host.ts`.

***

### EventMessage

> **EventMessage** = `{ [E in HostEvent]: { data: HostEvents[E]; event: E } }`\[[`HostEvent`](#hostevent)\]

The miniapp ↔ app contract, and nothing else: no DOM at import time, no
React, no dependencies. The app imports it for the parser and the scripts it
injects, skkuverse-server for the manifest parser, and the SDK for the types.

Messages are in `messages.ts`, the shell manifest in `manifest.ts`, safe
areas in `viewport.ts`, and the injected `window.skkuverse` in `host.ts`.

***

### GameEventMessage

> **GameEventMessage** = `{ [E in GameHostEvent]: { data: GameHostEvents[E]; event: E } }`\[[`GameHostEvent`](#gamehostevent)\]

The miniapp ↔ app contract, and nothing else: no DOM at import time, no
React, no dependencies. The app imports it for the parser and the scripts it
injects, skkuverse-server for the manifest parser, and the SDK for the types.

Messages are in `messages.ts`, the shell manifest in `manifest.ts`, safe
areas in `viewport.ts`, and the injected `window.skkuverse` in `host.ts`.

***

### GameHapticStyle

> **GameHapticStyle** = [`HapticStyle`](../README.md#hapticstyle) \| `"soft"` \| `"rigid"` \| `"error"` \| `"success"`

`light`, `medium`, `heavy`, `soft` and `rigid` are impact taps. `error` is a
short, hard tap for a slip, not the notification pattern, which is too long
to repeat. `success` is that notification pattern, for a moment that comes
at most once a run.

***

### GameHostEvent

> **GameHostEvent** = keyof [`GameHostEvents`](interfaces/GameHostEvents.md)

The miniapp ↔ app contract, and nothing else: no DOM at import time, no
React, no dependencies. The app imports it for the parser and the scripts it
injects, skkuverse-server for the manifest parser, and the SDK for the types.

Messages are in `messages.ts`, the shell manifest in `manifest.ts`, safe
areas in `viewport.ts`, and the injected `window.skkuverse` in `host.ts`.

***

### GameNotifyMethod

> **GameNotifyMethod** = keyof [`GameNotifyMethods`](interfaces/GameNotifyMethods.md)

The miniapp ↔ app contract, and nothing else: no DOM at import time, no
React, no dependencies. The app imports it for the parser and the scripts it
injects, skkuverse-server for the manifest parser, and the SDK for the types.

Messages are in `messages.ts`, the shell manifest in `manifest.ts`, safe
areas in `viewport.ts`, and the injected `window.skkuverse` in `host.ts`.

***

### GamePhase

> **GamePhase** = `"ready"` \| `"running"` \| `"paused"` \| `"crashed"`

Where a game run is. `crashed` waits for the host: a revive, a restart or a reset.

***

### GameStats

> **GameStats** = `Readonly`\<`Record`\<`string`, `number`\>\>

A small map of finite numbers under plain keys, in the game's own vocabulary.

***

### HostEvent

> **HostEvent** = keyof [`HostEvents`](interfaces/HostEvents.md)

The miniapp ↔ app contract, and nothing else: no DOM at import time, no
React, no dependencies. The app imports it for the parser and the scripts it
injects, skkuverse-server for the manifest parser, and the SDK for the types.

Messages are in `messages.ts`, the shell manifest in `manifest.ts`, safe
areas in `viewport.ts`, and the injected `window.skkuverse` in `host.ts`.

***

### HostMessage

> **HostMessage** = [`Response`](#response) \| [`EventMessage`](#eventmessage)

The miniapp ↔ app contract, and nothing else: no DOM at import time, no
React, no dependencies. The app imports it for the parser and the scripts it
injects, skkuverse-server for the manifest parser, and the SDK for the types.

Messages are in `messages.ts`, the shell manifest in `manifest.ts`, safe
areas in `viewport.ts`, and the injected `window.skkuverse` in `host.ts`.

***

### MiniappNotifyMethod

> **MiniappNotifyMethod** = keyof [`MiniappNotifyMethods`](interfaces/MiniappNotifyMethods.md)

The miniapp ↔ app contract, and nothing else: no DOM at import time, no
React, no dependencies. The app imports it for the parser and the scripts it
injects, skkuverse-server for the manifest parser, and the SDK for the types.

Messages are in `messages.ts`, the shell manifest in `manifest.ts`, safe
areas in `viewport.ts`, and the injected `window.skkuverse` in `host.ts`.

***

### Notification

> **Notification** = `{ [M in NotifyMethod]: { id?: undefined; method: M; params: NotifyMethods[M] } }`\[[`NotifyMethod`](#notifymethod)\]

The miniapp ↔ app contract, and nothing else: no DOM at import time, no
React, no dependencies. The app imports it for the parser and the scripts it
injects, skkuverse-server for the manifest parser, and the SDK for the types.

Messages are in `messages.ts`, the shell manifest in `manifest.ts`, safe
areas in `viewport.ts`, and the injected `window.skkuverse` in `host.ts`.

***

### NotifyMethod

> **NotifyMethod** = keyof [`NotifyMethods`](interfaces/NotifyMethods.md)

The miniapp ↔ app contract, and nothing else: no DOM at import time, no
React, no dependencies. The app imports it for the parser and the scripts it
injects, skkuverse-server for the manifest parser, and the SDK for the types.

Messages are in `messages.ts`, the shell manifest in `manifest.ts`, safe
areas in `viewport.ts`, and the injected `window.skkuverse` in `host.ts`.

***

### PageMessage

> **PageMessage** = [`Notification`](#notification) \| [`Request`](interfaces/Request.md)

The miniapp ↔ app contract, and nothing else: no DOM at import time, no
React, no dependencies. The app imports it for the parser and the scripts it
injects, skkuverse-server for the manifest parser, and the SDK for the types.

Messages are in `messages.ts`, the shell manifest in `manifest.ts`, safe
areas in `viewport.ts`, and the injected `window.skkuverse` in `host.ts`.

***

### RequestMethod

> **RequestMethod** = keyof [`RequestMethods`](interfaces/RequestMethods.md)

The miniapp ↔ app contract, and nothing else: no DOM at import time, no
React, no dependencies. The app imports it for the parser and the scripts it
injects, skkuverse-server for the manifest parser, and the SDK for the types.

Messages are in `messages.ts`, the shell manifest in `manifest.ts`, safe
areas in `viewport.ts`, and the injected `window.skkuverse` in `host.ts`.

***

### Response

> **Response** = \{ `id`: `string`; `ok`: `true`; `result`: `unknown`; \} \| \{ `error`: [`ProtocolError`](interfaces/ProtocolError.md); `id`: `string`; `ok`: `false`; \}

The miniapp ↔ app contract, and nothing else: no DOM at import time, no
React, no dependencies. The app imports it for the parser and the scripts it
injects, skkuverse-server for the manifest parser, and the SDK for the types.

Messages are in `messages.ts`, the shell manifest in `manifest.ts`, safe
areas in `viewport.ts`, and the injected `window.skkuverse` in `host.ts`.

***

### ShellBar

> **ShellBar** = `"top"` \| `"bottom"` \| `"none"`

The shell a miniapp asks the app to draw around it.

A miniapp declares it in `public/skkuverse.json`, served from its own
origin. skkuverse-server fetches that file for first-party miniapps and
merges it into the registry's `GET /miniapps/:id`, so the app knows the shell
before it creates the WebView and the first frame is already right.
`shell.set` changes the parts that may change mid-session.

Parsing is tolerant everywhere: an unknown key or a bad value is dropped and
the default takes its place. A miniapp with a broken manifest still opens.

***

### ShellHeader

> **ShellHeader** = `"opaque"` \| `"overlay"`

***

### ShellStatusBar

> **ShellStatusBar** = `"dark"` \| `"light"`

## Variables

### DEFAULT\_SHELL

> `const` **DEFAULT\_SHELL**: `Readonly`\<[`ShellConfig`](../interfaces/ShellConfig.md)\>

***

### GAME\_EVENTS

> `const` **GAME\_EVENTS**: readonly [`GameHostEvent`](#gamehostevent)[]

Every event the host sends a game page.

***

### GAME\_NOTIFY\_METHODS

> `const` **GAME\_NOTIFY\_METHODS**: readonly [`GameNotifyMethod`](#gamenotifymethod)[]

Every game notify method, for the app's capability list for a game origin.

***

### GAME\_PROTOCOL

> `const` **GAME\_PROTOCOL**: `1` = `1`

The game protocol this SDK speaks. The host sends its own in `game.init`, so
a page built for a newer one can leave out what an older host lacks. Bumped
when a `game.*` method, event or field is added.

***

### MANIFEST\_PATH

> `const` **MANIFEST\_PATH**: `"/skkuverse.json"` = `'/skkuverse.json'`

Where a miniapp serves its manifest, relative to its origin.

***

### MESSAGE\_EVENT

> `const` **MESSAGE\_EVENT**: `"skkuverse:message"` = `'skkuverse:message'`

The DOM event the host's `receive` dispatches on `window`, with the message as `detail`.

***

### NOTIFY\_METHODS

> `const` **NOTIFY\_METHODS**: readonly [`MiniappNotifyMethod`](#miniappnotifymethod)[]

Every mini-app notify method, for the app's capability list for a mini-app origin.

***

### PROTOCOL\_VERSION

> `const` **PROTOCOL\_VERSION**: `1` = `1`

Bumped only when the envelope itself changes. Methods come and go freely.

***

### ZERO\_INSETS

> `const` **ZERO\_INSETS**: `Readonly`\<[`Insets`](../interfaces/Insets.md)\>

***

### ZERO\_VIEWPORT

> `const` **ZERO\_VIEWPORT**: `Readonly`\<[`Viewport`](../interfaces/Viewport.md)\>

## Functions

- [hostBootstrapScript](functions/hostBootstrapScript.md)
- [hostDeliverScript](functions/hostDeliverScript.md)
- [isViewport](functions/isViewport.md)
- [mergeShell](functions/mergeShell.md)
- [parseGameEvent](functions/parseGameEvent.md)
- [parseManifest](functions/parseManifest.md)
- [parseMessage](functions/parseMessage.md)
- [parseShellFields](functions/parseShellFields.md)
- [parseShellPatch](functions/parseShellPatch.md)
- [sameViewport](functions/sameViewport.md)
- [viewportCssVars](functions/viewportCssVars.md)

## References

### Chrome

Re-exports [Chrome](../README.md#chrome)

***

### HapticStyle

Re-exports [HapticStyle](../README.md#hapticstyle)

***

### Insets

Re-exports [Insets](../interfaces/Insets.md)

***

### Method

Re-exports [Method](../README.md#method)

***

### ShellConfig

Re-exports [ShellConfig](../interfaces/ShellConfig.md)

***

### ShellPatch

Re-exports [ShellPatch](../README.md#shellpatch)

***

### Viewport

Re-exports [Viewport](../interfaces/Viewport.md)
