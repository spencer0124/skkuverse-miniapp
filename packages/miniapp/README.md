# @skkuverse/miniapp

The SDK a skkuverse miniapp uses to talk to the skkuverse app. Every function is safe
to call anywhere: outside the app it is a no-op or a browser fallback.

```tsx
import { MiniappRoot } from '@skkuverse/miniapp/react';

createRoot(el).render(
  <MiniappRoot id="mukja" dev={import.meta.env.DEV}>
    <App />
  </MiniappRoot>,
);
```

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

Declare the shell the app draws around the page in `public/skkuverse.json`.

See the [protocol reference](https://github.com/spencer0124/skkuverse-miniapp/blob/main/docs/reference/protocol.md).
