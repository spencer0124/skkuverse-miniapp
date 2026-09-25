/**
 * React bindings. Wrap the app in `MiniappRoot`; the hooks throw outside it.
 * Nothing here imports `@skkuverse/ui` — the SDS-styled components are in
 * `@skkuverse/miniapp/react/ui`.
 */
export { MiniappRoot, useMiniappRoot, openInAppUrl, type MiniappRootProps } from './MiniappRoot';
export { useIsInApp, useCapabilities, useCanOpenMap, useCanOpenMiniapp, useViewport } from './hooks';
