import {
  GAME_PROTOCOL,
  sameViewport,
  type GameNotifyMethod,
  type HostEvent,
  type HostEvents,
  type MiniappNotifyMethod,
  type NotifyMethods,
  type ShellConfig,
  type Viewport,
} from '@skkuverse/miniapp/protocol';
import { viewportFor, type DevHostConfig } from './shared';

export interface HostContext {
  readonly config: DevHostConfig;
  shell: Pick<ShellConfig, 'header' | 'statusBar' | 'background'>;
  viewport: Viewport;
  deliver<E extends HostEvent>(event: E, data: HostEvents[E]): void;
  after(ms: number | null, fn: () => void): void;
}

type Handlers = {
  [M in MiniappNotifyMethod | GameNotifyMethod]: (params: NotifyMethods[M], host: HostContext) => void;
};

const report = (): void => {};

export const handlers = {
  'haptic.impact': report,
  'link.open': report,
  'map.openPlace': report,
  'miniapp.open': report,
  'share.open': report,
  'analytics.track': report,
  'app.ready': report,
  'shell.set': (patch, host) => {
    host.shell = { ...host.shell, ...patch };
    const next = viewportFor(host.config.viewport, host.shell.header);
    if (sameViewport(next, host.viewport)) return;
    host.viewport = next;
    host.deliver('viewport.changed', next);
  },
  'game.ready': (_params, host) => {
    const { init } = host.config;
    if (init === false) return;
    host.after(host.config.initDelayMs, () =>
      host.deliver('game.init', { gameProtocol: GAME_PROTOCOL, hi: 0, sound: true, ...init }),
    );
  },
  'game.start': report,
  'game.phase': report,
  'game.layout': report,
  'game.haptic': report,
  'game.over': report,
} satisfies Handlers;
