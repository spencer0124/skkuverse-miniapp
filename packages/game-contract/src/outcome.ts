/**
 * How one session of a page ended. Only `broken` is a verdict on the page: the
 * session played it and the contract checker named a rule it broke. `error` is
 * every other way a session can end without a verdict, such as a page the
 * runner could not load or a vitest that could not start.
 */
export type Outcome = 'kept' | 'broken' | 'error';

/**
 * The exit code `session.ts` ends with for each outcome. Node exits 1 on an
 * uncaught error and uses codes up to 14 for its own failures, so `broken`
 * takes a code above those, which a crash cannot give.
 */
export const SESSION_EXIT = { kept: 0, broken: 20, error: 1 } as const satisfies Record<Outcome, number>;

/** The `name` of the error `assertContract` throws, which `session.ts` reads as `broken`. */
export const CONTRACT_BROKEN = 'ContractBroken';

export function outcomeOf(status: number | null): Outcome {
  if (status === SESSION_EXIT.kept) return 'kept';
  if (status === SESSION_EXIT.broken) return 'broken';
  return 'error';
}
