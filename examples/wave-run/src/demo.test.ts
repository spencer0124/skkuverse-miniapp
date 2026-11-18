import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Window } from 'happy-dom';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createFakeHost } from '@skkuverse/miniapp/testing';
import { bootDemo } from './demo';

const page = readFileSync(join(process.cwd(), 'index.html'), 'utf8');

// happy-dom draws nothing, so the canvas gets a context that accepts every call.
function noopContext(): CanvasRenderingContext2D {
  const fn: unknown = new Proxy(() => fn, { get: (_, key) => (key === 'canvas' ? document.createElement('canvas') : fn) });
  return fn as CanvasRenderingContext2D;
}

describe('the wave run demo on the fake host', () => {
  const host = createFakeHost();

  beforeAll(async () => {
    // The page guard pins the timers on its window for good, so the page gets a window of its own and the runner keeps its.
    const win = new Window();
    win.HTMLCanvasElement.prototype.getContext = noopContext as never;
    win.document.body.innerHTML = /<body>([\s\S]*)<\/body>/.exec(page)![1]!.replace(/<script[\s\S]*?<\/script>/, '');
    vi.stubGlobal('window', win);
    vi.stubGlobal('document', win.document);
    host.install();
    bootDemo(host);
    await host.flush();
  });

  afterAll(() => vi.unstubAllGlobals());

  it('sends game.ready first and starts no run before the host answers', () => {
    expect(host.methods()[0]).toBe('game.ready');
    expect(host.methods()).toEqual(['game.ready']);
  });

  it('is answered with game.init', () => {
    expect(host.log.map((entry) => (entry.from === 'host' ? entry.event : entry.message?.method))).toEqual(['game.ready', 'game.init']);
  });

  it('lists both messages in the panel, in order and by direction', async () => {
    await vi.waitFor(() => {
      const items = [...document.querySelectorAll<HTMLElement>('#panel .hp-entry')];
      expect(items.map((item) => [item.dataset.method, item.dataset.direction])).toEqual([
        ['game.ready', 'page-to-app'],
        ['game.init', 'app-to-page'],
      ]);
    });
  });
});
