/** Breaks N3: /about renders outside <MiniappRoot>. */
import { createRoot } from 'react-dom/client';
import { handleLinkClick, haptic, openUrl } from '@skkuverse/miniapp';
import { MiniappRoot } from '@skkuverse/miniapp/react';

const SITE = 'https://example.org/';
const query = new URLSearchParams(location.search);
const source = query.get('utm_source');
const now = import.meta.env.DEV ? query.get('now') : null;

function Home() {
  return (
    <main data-source={source === null ? undefined : 'set'}>
      <h1>n3-bad</h1>
      <p>{now ?? 'live clock'}</p>
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
  location.pathname === '/about' ? (
    <About />
  ) : (
    <MiniappRoot id="n3-bad" browser="allow">
      <Home />
    </MiniappRoot>
  ),
);
