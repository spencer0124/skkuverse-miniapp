/**
 * The runner mounts a page's <body> without its scripts, which the page's
 * `load` imports instead: whatever happy-dom parses as a script is dropped.
 */
import { expect, test } from 'vitest';
import { runContract } from '../src/harness';

const page = (body: string) => `<!DOCTYPE html><html lang="ko"><head></head><body>${body}</body></html>`;

async function mountedScripts(body: string): Promise<number> {
  let scripts = -1;
  await runContract({
    html: page(body),
    load: async () => {
      scripts = document.querySelectorAll('script').length;
    },
  });
  return scripts;
}

test.each([
  ['a script tag joined across a removed script', '<canvas id="game"></canvas><scr<script></script>ipt src="/a.js"></script>'],
  ['a script end tag with attributes', '<canvas id="game"></canvas><script type="module" src="/src/main.ts"></script foo>'],
])('mounts no script from %s', async (_name, body) => {
  expect(await mountedScripts(body)).toBe(0);
});
