/**
 * The Phosphor glyphs the components in this package draw.
 *
 * Same icon family as the React Native app, which uses `phosphor-react-native`.
 * `@phosphor-icons/react` is the same project's React build, and as of 2.1.x it
 * shares the API: the `*Icon` suffix, and `size` / `weight` / `color` props with
 * the same `IconWeight` union. So an icon reads the same in either codebase.
 *
 * Imported by their per-icon paths rather than from the package barrel. The
 * barrel re-exports over 1,500 icons; production builds tree-shake that away,
 * but a dev server transforms every one of them on first load. `./dist/csr/*`
 * is a documented entry in the package's own exports map.
 */
export { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
export { CaretLeftIcon } from '@phosphor-icons/react/dist/csr/CaretLeft';
export { CaretRightIcon } from '@phosphor-icons/react/dist/csr/CaretRight';
export { CaretUpIcon } from '@phosphor-icons/react/dist/csr/CaretUp';
export { CheckIcon } from '@phosphor-icons/react/dist/csr/Check';
export { CheckCircleIcon } from '@phosphor-icons/react/dist/csr/CheckCircle';
export { InfoIcon } from '@phosphor-icons/react/dist/csr/Info';
export { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
export { MinusIcon } from '@phosphor-icons/react/dist/csr/Minus';
export { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus';
export { StarIcon } from '@phosphor-icons/react/dist/csr/Star';
export { WarningIcon } from '@phosphor-icons/react/dist/csr/Warning';
export { WarningCircleIcon } from '@phosphor-icons/react/dist/csr/WarningCircle';
export { XIcon } from '@phosphor-icons/react/dist/csr/X';
export { XCircleIcon } from '@phosphor-icons/react/dist/csr/XCircle';

export type { Icon, IconProps, IconWeight } from '@phosphor-icons/react';
