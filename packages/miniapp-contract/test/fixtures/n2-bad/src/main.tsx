/** Breaks N2: `?debug=1` turns on a debug line in the production build, not only under import.meta.env.DEV. */
import { createRoot } from 'react-dom/client';
import { handleLinkClick, haptic, openUrl } from '@skkuverse/miniapp';
import { MiniappRoot } from '@skkuverse/miniapp/react';

const SITE = 'https://example.org/';
const query = new URLSearchParams(location.search);
const source = query.get('utm_source');
const now = import.meta.env.DEV ? query.get('now') : null;
const debug = query.get('debug');

function Home() {
  return (
    <main data-source={source === null ? undefined : 'set'}>
      <h1>n2-bad</h1>
      <p>{now ?? 'live clock'}</p>
      {debug ? <p>debug: every request is logged</p> : null}
      <a href={SITE} onClick={(event) => handleLinkClick(event, SITE)}>
        site
      </a>
      <button onClick={() => openUrl('https://example.com/news')}>news</button>
      <button onClick={() => haptic('light')}>tap</button>
      <a href="/about">about</a>
    </main>
  );
}

function About() {
  return (
    <main>
      <h1>about</h1>
      <a href="/">home</a>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <MiniappRoot id="n2-bad" browser="allow">
    {location.pathname === '/about' ? <About /> : <Home />}
  </MiniappRoot>,
);
