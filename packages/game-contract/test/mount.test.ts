/**
 * The runner mounts a page's <body> as a browser parses it, without its
 * scripts, which the page's `load` imports instead.
 */
import { expect, test } from 'vitest';
import { runContract } from '../src/harness';

const page = (body: string) => `<!DOCTYPE html><html lang="ko"><head></head><body>${body}</body></html>`;

async function mounted(body: string): Promise<{ canvas: boolean; scripts: number }> {
  let seen = { canvas: false, scripts: -1 };
  await runContract({
    html: page(body),
    load: async () => {
      seen = { canvas: document.querySelector('canvas#game') !== null, scripts: document.querySelectorAll('script').length };
    },
  });
  return seen;
}

test.each([
  ['a comment cut out of a bogus comment', '<!<!-- -->-- <canvas id="game"></canvas> -->'],
  ['a script tag joined across a removed script', '<canvas id="game"></canvas><scr<script></script>ipt src="/a.js"></script>'],
  ['a script end tag with attributes', '<script type="module" src="/src/main.ts"></script foo><canvas id="game"></canvas>'],
])('mounts %s as a browser would', async (_name, body) => {
  expect(await mounted(body)).toEqual({ canvas: true, scripts: 0 });
});
