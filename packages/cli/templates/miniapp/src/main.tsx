import React from 'react';
import ReactDOM from 'react-dom/client';
import { MiniappRoot } from '@skkuverse/miniapp/react';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* browser="block" shows a browser visitor the "open in the app" page;
        "allow" renders the miniapp in a browser too. Spec R3: say which. */}
    <MiniappRoot id="__ID__" browser="block" dev={import.meta.env.DEV}>
      <App />
    </MiniappRoot>
  </React.StrictMode>,
);
