/**
 * The client a game page boots through. It imports no package, so a game's
 * bundle carries nothing beyond this SDK's own code.
 *
 * `installPageGuard` is what `bootGame` installs first; the parts are exported
 * for a game that guards a field of its own on top.
 */
export { blocksEvent, installGuard, installPageGuard, lockGlobals } from './guard';
