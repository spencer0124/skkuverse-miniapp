import { useEffect, useState } from 'react';

/**
 * Fetch a Lottie animation from a URL.
 *
 * The design system's `lottie` prop is a URL, but `lottie-react` takes parsed
 * `animationData` — its options type omits `path` — so the fetch happens here.
 *
 * Results are cached per URL for the life of the page. A toast that appears
 * repeatedly is the normal case, and refetching the same animation each time is
 * both wasteful and visible as a delay before the first frame.
 *
 * A failed fetch resolves to `undefined` rather than throwing. A decoration that
 * cannot load must not take the message down with it.
 */
const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

function load(src: string): Promise<unknown> {
  const cached = inflight.get(src);
  if (cached) return cached;

  const request = fetch(src)
    .then((res) => (res.ok ? res.json() : undefined))
    .catch(() => undefined)
    .then((data) => {
      if (data !== undefined) cache.set(src, data);
      inflight.delete(src);
      return data;
    });

  inflight.set(src, request);
  return request;
}

export function useLottieData(src?: string): unknown {
  const [data, setData] = useState<unknown>(() => (src ? cache.get(src) : undefined));

  useEffect(() => {
    if (!src) { setData(undefined); return; }

    const hit = cache.get(src);
    if (hit !== undefined) { setData(hit); return; }

    let active = true;
    load(src).then((loaded) => { if (active) setData(loaded); });
    return () => { active = false; };
  }, [src]);

  return data;
}
