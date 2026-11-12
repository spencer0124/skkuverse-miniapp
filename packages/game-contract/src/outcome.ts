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

/**
 * What `page.contract.ts` records in its test's metadata (vitest's
 * `task.meta`), which reaches `session.ts` through the reporter API.
 * `contractBroken` is set when the contract checker named a rule the page
 * broke. `session.ts` reads `broken` from here and not from the test's error,
 * whose name and message a page's own error can copy.
 */
export interface ContractMeta {
  contractBroken?: true;
}

export function outcomeOf(status: number | null): Outcome {
  if (status === SESSION_EXIT.kept) return 'kept';
  if (status === SESSION_EXIT.broken) return 'broken';
  return 'error';
}
