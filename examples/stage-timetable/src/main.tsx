import { createRoot } from 'react-dom/client';
import { MiniappRoot } from '@skkuverse/miniapp/react';
import { NOTIFY_METHODS } from '@skkuverse/miniapp/protocol';
import { createFakeHost } from '@skkuverse/miniapp/testing';
import { SDSProvider } from '@skkuverse/ui';
import App from './App';

// The fake host runs the app's real bootstrap script in this window, so the page takes the same code path it takes
// inside the app, and every bridge message lands in host.log. `?host=none` leaves it out, as a plain browser would.
const host = new URLSearchParams(location.search).get('host') === 'none' ? null : createFakeHost({ capabilities: NOTIFY_METHODS });
host?.install();

createRoot(document.getElementById('root')!).render(
  <MiniappRoot id="stage-timetable" browser="allow">
    <SDSProvider>
      <App host={host} />
    </SDSProvider>
  </MiniappRoot>,
);
