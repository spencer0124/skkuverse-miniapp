# @skkuverse/ui

The web port of the SKKU Design System (SDS), the design system of the skkuverse app.
Wrap the page in `SDSProvider` and use the components.

```tsx
import { SDSProvider, Button } from '@skkuverse/ui';

<SDSProvider colorPreference="light">
  <Button color="primary" onClick={go}>Start</Button>
</SDSProvider>;
```

Requires React 19.
