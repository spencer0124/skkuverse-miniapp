import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_NOTIFY_METHODS, hostBootstrapScript, NOTIFY_METHODS, parseManifest, ZERO_VIEWPORT } from '@skkuverse/miniapp/protocol';
import { resolvePreset, type HostPresetName } from '@skkuverse/miniapp/testing';
import { SENTINEL, viewportFor, type DevHostConfig } from './shared';

export const LOG_EVENT = 'skkuverse:log';

/** From `src/` this resolves into `dist/` too, so tests need a build first. */
const HOST_ENTRY = fileURLToPath(new URL('../dist/host-entry.js', import.meta.url));

export function readHostEntry(): string {
  if (!existsSync(HOST_ENTRY)) throw new Error(`${HOST_ENTRY} is missing: build @skkuverse/vite-plugin-miniapp first`);
  return readFileSync(HOST_ENTRY, 'utf8');
}

/** `Infinity` becomes null because JSON cannot carry it. */
function finiteMs(ms: number | undefined): number | null {
  if (ms === undefined) return 0;
  return Number.isFinite(ms) ? ms : null;
}

/** A page with no manifest is a game, which the app hosts full screen, so it starts `overlay`. */
function startingHeader(publicDir: string | false): DevHostConfig['header'] {
  const manifest = publicDir === false ? null : join(publicDir, 'skkuverse.json');
  if (manifest === null || !existsSync(manifest)) return 'overlay';
  let json: unknown;
  try {
    json = JSON.parse(readFileSync(manifest, 'utf8'));
  } catch {
    json = null;
  }
  return parseManifest(json).shell.header;
}

export function resolveHostConfig(name: HostPresetName, publicDir: string | false): DevHostConfig {
  const preset = resolvePreset(name);
  return {
    preset: name,
    capabilities: preset.capabilities ?? [...NOTIFY_METHODS, ...GAME_NOTIFY_METHODS],
    viewport: preset.viewport ?? ZERO_VIEWPORT,
    header: startingHeader(publicDir),
    installDelayMs: finiteMs(preset.hostDelayMs),
    initDelayMs: finiteMs(preset.initDelayMs),
    init: preset.init ?? {},
  };
}

/** The bootstrap goes in as a function, not a string, so a page under a CSP without `unsafe-eval` still runs it. */
export function hostScript(config: DevHostConfig, hostEntry: string, { hot }: { hot: boolean }): string {
  const bootstrap = hostBootstrapScript({
    capabilities: config.capabilities,
    viewport: viewportFor(config.viewport, config.header),
  });
  const log = hot ? `, log: import.meta.hot ? function (entry) { import.meta.hot.send(${JSON.stringify(LOG_EVENT)}, entry); } : undefined` : '';
  return `window.${SENTINEL} = Object.assign(${JSON.stringify(config)}, { bootstrap: function () {\n${bootstrap}\n}${log} });\n${hostEntry}\n`;
}

export const PARENT_SCRIPT = `/* ${SENTINEL}: the parent page hosts this one */
if (!window.parent || !window.parent.__playground) {
  throw new Error('[skkuverse dev host] host: "parent" needs a parent page that defines __playground.attach');
}
window.parent.__playground.attach(window);
`;
