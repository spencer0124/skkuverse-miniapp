# @skkuverse/miniapp

The SDK a skkuverse miniapp uses to talk to the skkuverse app. Every function is safe
to call anywhere: outside the app it is a no-op or a browser fallback.

```ts
import { getCapabilities, haptic, openUrl, openMapPlace } from '@skkuverse/miniapp';

haptic('light');
openUrl('https://open.spotify.com/track/…', { appUrl: 'spotify:track:…' });
if (getCapabilities().capabilities.has('action.map')) openMapPlace('event:42');
```

```tsx
import { MapButton, useIsInApp } from '@skkuverse/miniapp/react';

<MapButton place="event:42">지도에서 보기</MapButton>;
```

- `@skkuverse/miniapp` is the SDK.
- `@skkuverse/miniapp/protocol` holds the message types only, with no DOM or React.
- `@skkuverse/miniapp/react` holds the hooks and `MapButton`, which needs `@skkuverse/ui`.

See the [protocol reference](https://github.com/spencer0124/skkuverse-miniapp/blob/main/docs/reference/protocol.md).
