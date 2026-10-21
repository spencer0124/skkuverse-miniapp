import {
  isViewport,
  MESSAGE_EVENT,
  parseGameEvent,
  type GameHapticStyle,
  type GameInit,
  type GameOver,
  type GamePhase,
  type GameRect,
  type Viewport,
} from '../protocol';
import { host, notify } from '../transport';
import { installPageGuard } from './guard';

/** How often `bootGame` looks for the host while it is not there yet. */
export const HOST_POLL_MS = 50;
/** How long `bootGame` looks for the host before it gives up. */
export const HOST_WAIT_MS = 10_000;

/**
 * What a game page does when the host speaks. Every handler but `onInit` is
 * optional, and the host's word is final: a page obeys pause, sound and reset
 * rather than deciding them itself.
 */
export interface GameHandlers {
  /**
   * The host answered `game.ready`. Until it does, `start()` refuses, so no
   * run can begin. `init.gameProtocol` is the host's game protocol: a page
   * built for a newer one leaves out what the host lacks rather than failing.
   */
  onInit(init: GameInit): void;
  /** Stop the run's clock and its audio until `onResume`. */
  onPause?(): void;
  onResume?(): void;
  /** Sound on or off. The first setting comes in `onInit`. */
  onSound?(on: boolean): void;
  /** Back to the title, with no run started. */
  onReset?(): void;
  /** Start a new run straight away. */
  onRestart?(): void;
  /** Continue the crashed run. The host sends it only after a rewarded ad paid out. */
  onRevive?(): void;
  /**
   * Called on every press the player really made (`pointerdown`, `keydown`),
   * before the game hears it: iOS opens audio only inside a tap, and a later
   * press wakes a context the OS suspended. Make it idempotent.
   */
  onAudioUnlock?(): void;
  /**
   * The viewport once the host is found, then on every change. The CSS
   * variables (`--sv-inset-*`) are already applied by the host; this is for a
   * canvas or other layout done in script.
   */
  onViewport?(viewport: Viewport): void;
  /**
   * The host never appeared within the wait, or it does not host games (a
   * browser, or the mini-app shell). Show nothing interactive.
   */
  onNoHost?(): void;
  /** Where the host may anchor its title, sent with `game.ready`. */
  rect?(): GameRect | null | undefined;
}

export interface BootOptions {
  /** Defaults to `HOST_POLL_MS`. */
  pollMs?: number;
  /** Defaults to `HOST_WAIT_MS`. */
  waitMs?: number;
}

/** What a page reports through. Every call is a no-op outside a game host. */
export interface GameClient {
  /** What `game.init` said, or null before it arrived. */
  readonly init: GameInit | null;
  /** Report that a run began. Refused, and false, before `game.init`. */
  start(): boolean;
  phase(phase: GamePhase): void;
  /** A rectangle the host draws over moved. */
  layout(rect: GameRect): void;
  haptic(style: GameHapticStyle): void;
  /** The run ended. Send it once a run, again only after `onRevive`. */
  over(result: GameOver): void;
  /** Stop listening and looking for the host. For tests and hot reloads. */
  dispose(): void;
}

/**
 * Boot a game page. Call it first in the page's entry.
 *
 * In order: installs the page guard, subscribes to the host's events, then
 * looks for the host every `pollMs` for up to `waitMs` (Android can run the
 * host's first bootstrap on a document it then replaces, and the host injects
 * it again once loading ends) and sends `game.ready` once it is there. A run
 * may start only after `game.init`.
 *
 * It installs no visibility or focus handler: pausing is the host's call. A
 * page that wants to know how often it was hidden counts it for telemetry.
 */
export function bootGame(handlers: GameHandlers, options: BootOptions = {}): GameClient {
  installPageGuard();
  const pollMs = options.pollMs ?? HOST_POLL_MS;
  const attempts = Math.max(0, Math.ceil((options.waitMs ?? HOST_WAIT_MS) / pollMs));
  let init: GameInit | null = null;
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const onMessage = (event: Event) => {
    const detail = (event as CustomEvent<unknown>).detail;
    const message = parseGameEvent(detail);
    if (!message) {
      const raw = detail as { event?: unknown; data?: unknown } | null;
      if (raw && typeof raw === 'object' && raw.event === 'viewport.changed' && isViewport(raw.data)) {
        handlers.onViewport?.(raw.data);
      }
      return;
    }
    if (message.event === 'game.init') {
      init = message.data;
      handlers.onInit(message.data);
      return;
    }
    // The host speaks only after `game.ready`, and a page acts on nothing
    // before it knows the host.
    if (!init) return;
    switch (message.event) {
      case 'game.pause':
        handlers.onPause?.();
        break;
      case 'game.resume':
        handlers.onResume?.();
        break;
      case 'game.sound':
        handlers.onSound?.(message.data.on);
        break;
      case 'game.reset':
        handlers.onReset?.();
        break;
      case 'game.restart':
        handlers.onRestart?.();
        break;
      case 'game.revive':
        handlers.onRevive?.();
        break;
    }
  };

  const onPress = (event: Event) => {
    if (event.isTrusted) handlers.onAudioUnlock?.();
  };

  const hasWindow = typeof window !== 'undefined';
  if (hasWindow) {
    window.addEventListener(MESSAGE_EVENT, onMessage);
    if (handlers.onAudioUnlock) {
      window.addEventListener('pointerdown', onPress, { capture: true });
      window.addEventListener('keydown', onPress, { capture: true });
    }
  }

  let left = attempts;
  const lookForHost = () => {
    timer = undefined;
    if (disposed) return;
    const found = host();
    if (found) {
      if (!found.capabilities.includes('game.ready')) {
        handlers.onNoHost?.();
        return;
      }
      handlers.onViewport?.(found.getViewport());
      const rect = handlers.rect?.();
      notify('game.ready', rect ? { rect } : {});
      return;
    }
    if (left <= 0 || !hasWindow) {
      handlers.onNoHost?.();
      return;
    }
    left -= 1;
    timer = setTimeout(lookForHost, pollMs);
  };
  lookForHost();

  return {
    get init() {
      return init;
    },
    start() {
      if (!init || disposed) return false;
      notify('game.start', {});
      return true;
    },
    phase(phase) {
      notify('game.phase', { phase });
    },
    layout(rect) {
      notify('game.layout', { rect });
    },
    haptic(style) {
      notify('game.haptic', { style });
    },
    over(result) {
      notify('game.over', result);
    },
    dispose() {
      disposed = true;
      if (timer !== undefined) clearTimeout(timer);
      if (!hasWindow) return;
      window.removeEventListener(MESSAGE_EVENT, onMessage);
      window.removeEventListener('pointerdown', onPress, { capture: true });
      window.removeEventListener('keydown', onPress, { capture: true });
    },
  };
}
