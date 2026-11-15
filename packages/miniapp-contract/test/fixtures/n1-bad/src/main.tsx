/** Breaks N1: the link to the site is a plain anchor, so inside the app it leaves the page without link.open. */
import { createRoot } from 'react-dom/client';
import { haptic, openUrl } from '@skkuverse/miniapp';
import { MiniappRoot } from '@skkuverse/miniapp/react';

const SITE = 'https://example.org/';
const query = new URLSearchParams(location.search);
const source = query.get('utm_source');
const now = import.meta.env.DEV ? query.get('now') : null;

function Home() {
  return (
    <main data-source={source === null ? undefined : 'set'}>
      <h1>n1-bad</h1>
      <p>{now ?? 'live clock'}</p>
      <a href={SITE}>site</a>
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
  <MiniappRoot id="n1-bad" browser="allow">
    {location.pathname === '/about' ? <About /> : <Home />}
  </MiniappRoot>,
);
