import type { HostPresetName } from '@skkuverse/miniapp/testing';
import type { Plugin, ResolvedConfig } from 'vite';
import { hostScript, LOG_EVENT, PARENT_SCRIPT, readHostEntry, resolveHostConfig } from './script';
import { formatLogLine, type DevHostConfig, type LogEntry } from './shared';

export interface SkkuverseDevHostOptions {
  /**
   * The host state the page meets, by the names `createFakeHost` takes from
   * `@skkuverse/miniapp/testing`. Defaults to `granted`. `vite dev` takes the
   * `SKKUVERSE_PRESET` environment variable over this, so a run can switch host
   * without a config edit. `vite build` never reads it.
   */
  preset?: HostPresetName;
  /**
   * `serve` (default) installs the host in `vite dev` and leaves a build
   * untouched. `always` also emits it into a build, as a hashed script, for a
   * `vite preview` or a browser test that needs the in-app path. A build made
   * with `always` must never ship.
   */
  inject?: 'serve' | 'always';
  /**
   * `self` (default) runs the host in the page. `parent` hands the page's window
   * to `window.parent.__playground.attach(window)`, for a page a playground
   * frames, which then runs the bootstrap and answers the messages.
   */
  host?: 'self' | 'parent';
}

const VIRTUAL_ID = 'virtual:skkuverse-dev-host';
/** Vite serves a module whose id starts with NUL at `/@id/__x00__<id>`. */
const SERVED_PATH = `@id/__x00__${VIRTUAL_ID}`;
const ASSET_NAME = 'skkuverse-dev-host.js';

function isLogEntry(value: unknown): value is LogEntry {
  if (typeof value !== 'object' || value === null) return false;
  const { dir, name } = value as Partial<LogEntry>;
  return (dir === 'page' || dir === 'host' || dir === 'info') && typeof name === 'string';
}

/**
 * Gives `vite dev` a host, so a miniapp or game page runs the code path it runs
 * inside the skkuverse app: `window.skkuverse` and `window.ReactNativeWebView`
 * exist before the page's own script, and every message the page posts prints
 * one terminal line. Without it a page in `vite dev` is in a plain browser and
 * takes the fallback of every SDK call.
 */
export function skkuverseDevHost(options: SkkuverseDevHostOptions = {}): Plugin {
  const inject = options.inject ?? 'serve';
  const mode = options.host ?? 'self';
  let resolved: ResolvedConfig;
  let hostConfig: DevHostConfig;
  let hostEntry: string | undefined;

  const source = (hot: boolean) => {
    if (mode === 'parent') return PARENT_SCRIPT;
    hostEntry ??= readHostEntry();
    return hostScript(hostConfig, hostEntry, { hot });
  };

  return {
    name: 'skkuverse:dev-host',
    ...(inject === 'always' ? {} : { apply: 'serve' as const }),

    configResolved(config) {
      resolved = config;
      const fromEnv = config.command === 'serve' ? process.env.SKKUVERSE_PRESET : undefined;
      hostConfig = resolveHostConfig((fromEnv || options.preset || 'granted') as HostPresetName, config.publicDir);
    },

    configureServer(server) {
      server.ws.on(LOG_EVENT, (entry: unknown) => {
        if (isLogEntry(entry)) server.config.logger.info(formatLogLine(entry));
      });
      server.config.logger.info(
        formatLogLine({ dir: 'info', name: `dev host ready, preset ${hostConfig.preset}. Page messages print here.` }),
      );
    },

    resolveId(id) {
      return id === VIRTUAL_ID ? `\0${VIRTUAL_ID}` : undefined;
    },

    load(id) {
      return id === `\0${VIRTUAL_ID}` ? source(true) : undefined;
    },

    buildStart() {
      if (resolved.command !== 'build') return;
      this.emitFile({ type: 'asset', name: ASSET_NAME, source: source(false) });
    },

    transformIndexHtml: {
      // After Vite has bundled the page's own scripts, so this tag stays as written.
      order: 'post',
      handler(_html, ctx) {
        const asset = Object.values(ctx.bundle ?? {}).find((output) => output.type === 'asset' && output.names.includes(ASSET_NAME));
        const src = ctx.server ? `${resolved.base}${SERVED_PATH}` : asset ? `${resolved.base}${asset.fileName}` : null;
        if (src === null) throw new Error(`@skkuverse/vite-plugin-miniapp: ${ASSET_NAME} is not in the bundle, so the page has no host`);
        return [{ tag: 'script', attrs: { type: 'module', src }, injectTo: 'head-prepend' }];
      },
    },
  };
}

export type { HostPresetName } from '@skkuverse/miniapp/testing';
