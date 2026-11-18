import { createRoot } from 'react-dom/client';
import { MiniappRoot } from '@skkuverse/miniapp/react';
import { NOTIFY_METHODS } from '@skkuverse/miniapp/protocol';
import { createFakeHost } from '@skkuverse/miniapp/testing';
import { SDSProvider } from '@skkuverse/ui';
import '../../shared/host-panel.css';
import { mountHostPanel } from '../../shared/host-panel';
import './style.css';
import Home from './Home';
import { MINIAPP_ID } from './festival';
import { sheetFor } from './panel';

// The fake host stands in for the app and records every message. It installs before the page renders, as the app's bootstrap would.
const host = new URLSearchParams(location.search).get('host') === 'none' ? null : createFakeHost({ capabilities: NOTIFY_METHODS });
host?.install();

createRoot(document.getElementById('screen')!).render(
  <MiniappRoot id={MINIAPP_ID} browser="allow">
    <SDSProvider>
      <Home />
    </SDSProvider>
  </MiniappRoot>,
);

mountHostPanel({
  frame: document.getElementById('frame')!,
  panel: document.getElementById('panel')!,
  host,
  sheet: sheetFor,
});
