import { afterEach, describe, expect, it } from 'vitest';
import { bindInput } from './input';
import type { Input } from './engine';

describe('bindInput', () => {
  const unbind: Array<() => void> = [];
  afterEach(() => {
    for (const fn of unbind.splice(0)) fn();
    document.body.replaceChildren();
  });

  function setup() {
    const stage = document.createElement('div');
    const button = document.createElement('button');
    document.body.append(stage, button);
    const presses: Input[] = [];
    unbind.push(bindInput(stage, (i) => presses.push(i)));
    return { button, presses };
  }

  it('jumps on Space and cancels the key', () => {
    const { presses } = setup();
    const e = new KeyboardEvent('keydown', { code: 'Space', cancelable: true, bubbles: true });
    document.body.dispatchEvent(e);
    expect(presses).toEqual(['jump']);
    expect(e.defaultPrevented).toBe(true);
  });

  it('leaves Space to a focused button, so the retry button works from the keyboard', () => {
    const { button, presses } = setup();
    const e = new KeyboardEvent('keydown', { code: 'Space', cancelable: true, bubbles: true });
    button.dispatchEvent(e);
    expect(presses).toEqual([]);
    expect(e.defaultPrevented).toBe(false);
  });

  it('releases a held duck and jump when the window loses focus', () => {
    const { presses } = setup();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown', bubbles: true }));
    window.dispatchEvent(new Event('blur'));
    expect(presses).toEqual(['duck', 'jumpEnd', 'duckEnd']);
  });
});
