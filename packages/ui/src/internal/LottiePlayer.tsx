import React, { Suspense, lazy } from 'react';
import { useLottieData } from './useLottieData';

/**
 * Lottie renderer, loaded on demand.
 *
 * `lottie-react` pulls in `lottie-web`, which is a few hundred kilobytes of
 * renderer. Almost every page that shows a toast shows one without an
 * animation, so importing it statically would charge every page for a feature
 * most of them never use. The dynamic import keeps it in its own chunk, fetched
 * the first time something actually renders a Lottie.
 *
 * Renders nothing until both the chunk and the animation have arrived, and
 * nothing at all if the animation fails to load.
 */
const Lottie = lazy(() => import('lottie-react'));

export interface LottiePlayerProps {
  /** URL of a Lottie JSON animation. */
  src: string;
  size?: number;
  /** @default true */
  loop?: boolean;
}

export function LottiePlayer({ src, size = 24, loop = true }: LottiePlayerProps) {
  const animationData = useLottieData(src);
  if (animationData === undefined) return null;

  return (
    <Suspense fallback={null}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay
        style={{ width: size, height: size, flexShrink: 0 }}
        aria-hidden
      />
    </Suspense>
  );
}

export default LottiePlayer;
