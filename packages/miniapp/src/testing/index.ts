/**
 * For tests, never for a page: a fake game host built on the app's real
 * bootstrap, the protocol contract every game keeps, and the pinned bound
 * points of the ranked games.
 */
export { createFakeHost, type ContractEntry, type FakeHost, type FakeHostOptions } from './fake-host';
export {
  FAILURE_MODE_NOTES,
  HOST_METHODS_ADDED,
  HOST_PRESETS,
  IPHONE_VIEWPORT,
  oldHostCapabilities,
  resolvePreset,
  type FailureMode,
  type FailureModes,
  type HostPreset,
  type HostPresetEntry,
  type HostPresetName,
  type OldHostVersion,
} from './presets';
export {
  assertGameContract,
  checkGameContract,
  GameContractError,
  type ContractRule,
  type ContractViolation,
} from './contract';
export { BOUND_FIXTURES, type BoundFixtures } from './bounds';
