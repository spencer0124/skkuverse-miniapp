import { useEffect, useState } from 'react';

export type ColorSchemeName = 'light' | 'dark';

const QUERY = '(prefers-color-scheme: dark)';

/**
 * Browser equivalent of React Native's `useColorScheme`.
 *
 * Starts at `'light'` rather than reading the media query during render, so
 * server rendering and the first client paint agree. The effect corrects it
 * immediately after mount.
 */
export function useColorScheme(): ColorSchemeName {
  const [scheme, setScheme] = useState<ColorSchemeName>('light');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(QUERY);
    const apply = (matches: boolean) => setScheme(matches ? 'dark' : 'light');

    apply(mq.matches);
    const onChange = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return scheme;
}
