# @skkuverse/miniapp

The SDK a skkuverse miniapp uses to talk to the skkuverse app. Every function is safe
to call anywhere: outside the app it is a no-op or a browser fallback.

```tsx
import { createRoot } from 'react-dom/client';
import { MiniappRoot } from '@skkuverse/miniapp/react';

function App() {
  return <main>Hello</main>;
}

createRoot(document.getElementById('root')!).render(
  <MiniappRoot id="mukja">
    <App />
  </MiniappRoot>,
);
```

In a Vite app, pass `dev={import.meta.env.DEV}` to `MiniappRoot` for the dev banner and mock insets. Without `dev` it turns them on at localhost and private addresses.

```ts
import { getCapabilities, haptic, openUrl, openMapPlace } from '@skkuverse/miniapp';

haptic('light');
openUrl('https://open.spotify.com/track/…', { appUrl: 'spotify:track:…' });
if (getCapabilities().capabilities.has('map.openPlace')) openMapPlace('event:42');
```

```css
.page { padding-top: calc(var(--sv-inset-top) + 16px); }
```

- `@skkuverse/miniapp` is the SDK.
- `@skkuverse/miniapp/protocol` is the contract with the app, with no DOM, React or dependencies.
- `@skkuverse/miniapp/react` holds `MiniappRoot`, which blocks plain browsers unless `browser="allow"`, and the hooks.
- `@skkuverse/miniapp/react/ui` holds `MapButton`, which needs `@skkuverse/ui`.
- `@skkuverse/miniapp/game` holds `bootGame`, which a game page boots through, and the page guard.
- `@skkuverse/miniapp/testing` holds a fake game host and the game contract, for tests.
- `@skkuverse/miniapp/fixtures/bounds.json` holds the pinned score bounds of the ranked games.

```ts
import { bootGame } from '@skkuverse/miniapp/game';

const stage = document.querySelector('canvas')!;
let ticks = 0;
let clock: number | undefined;

const run = () => { clock = window.setInterval(() => { ticks += 1; }, 1000 / 60); };
const stop = () => window.clearInterval(clock);

const game = bootGame({
  onInit: ({ hi, sound }) => console.log(`title: best ${hi}, sound ${sound ? 'on' : 'off'}`),
  onPause: stop,
  onResume: run,
});
stage.addEventListener('pointerdown', () => {
  if (game.start()) run(); // refused until game.init arrives
});
```

Declare the shell the app draws around the page in `public/skkuverse.json`.

See the [protocol reference](https://github.com/spencer0124/skkuverse-miniapp/blob/main/docs/reference/protocol.md).
