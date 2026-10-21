import type { ContractEntry } from './fake-host';

/**
 * The protocol contract every game page keeps, by name:
 *
 * - `every-message-parses`: each message parses as a `game.*` notification.
 * - `first-message-ready`: the first message is `game.ready`.
 * - `no-start-before-init`: no `game.start` before the host sent `game.init`.
 * - `start-before-over`: every `game.over` belongs to a run that `game.start` began.
 * - `one-over-per-run`: at most one `game.over` per run, and one more after each `game.revive`.
 */
export type ContractRule =
  | 'every-message-parses'
  | 'first-message-ready'
  | 'no-start-before-init'
  | 'start-before-over'
  | 'one-over-per-run';

export interface ContractViolation {
  rule: ContractRule;
  /** The entry in the log that broke it, or -1 for a log with no page message. */
  index: number;
  detail: string;
}

/** Every violation in a fake host's log, in order. Empty when the page kept the contract. */
export function checkGameContract(log: readonly ContractEntry[]): ContractViolation[] {
  const violations: ContractViolation[] = [];
  let initSent = false;
  let sawPage = false;
  let inRun = false;
  let oversThisRun = 0;
  let revived = false;

  log.forEach((entry, index) => {
    if (entry.from === 'host') {
      if (entry.event === 'game.init') initSent = true;
      if (entry.event === 'game.revive' && inRun && oversThisRun > 0) revived = true;
      // A reset ends the run with nothing started; a restart's run begins at the page's game.start.
      if (entry.event === 'game.reset') inRun = false;
      return;
    }

    const { message } = entry;
    if (!message || message.id !== undefined || !message.method.startsWith('game.')) {
      violations.push({ rule: 'every-message-parses', index, detail: `not a game notification: ${entry.raw.slice(0, 120)}` });
      return;
    }
    if (!sawPage) {
      sawPage = true;
      if (message.method !== 'game.ready') {
        violations.push({ rule: 'first-message-ready', index, detail: `the first message is ${message.method}` });
      }
    }

    if (message.method === 'game.start') {
      if (!initSent) violations.push({ rule: 'no-start-before-init', index, detail: 'game.start before game.init' });
      inRun = true;
      oversThisRun = 0;
      revived = false;
    } else if (message.method === 'game.over') {
      if (!inRun) {
        violations.push({ rule: 'start-before-over', index, detail: 'game.over with no run started' });
      } else if (oversThisRun > 0 && !revived) {
        violations.push({ rule: 'one-over-per-run', index, detail: `game.over number ${oversThisRun + 1} in one run with no game.revive before it` });
      }
      oversThisRun += 1;
      revived = false;
    }
  });

  if (!sawPage) violations.push({ rule: 'first-message-ready', index: -1, detail: 'the page sent nothing' });
  return violations;
}

/** Thrown by `assertGameContract`, naming every rule the page broke. */
export class GameContractError extends Error {
  readonly violations: readonly ContractViolation[];
  constructor(violations: readonly ContractViolation[]) {
    super(
      `game contract broken:\n${violations.map((v) => `  ${v.rule} (entry ${v.index}): ${v.detail}`).join('\n')}`,
    );
    this.name = 'GameContractError';
    this.violations = violations;
  }
}

/** Throws a `GameContractError` unless the log keeps the contract. */
export function assertGameContract(log: readonly ContractEntry[]): void {
  const violations = checkGameContract(log);
  if (violations.length > 0) throw new GameContractError(violations);
}
