import { isGranted, notify } from '../transport';

/**
 * Whether the app can open its map on a place. A button that asks for it must
 * not be drawn otherwise: in a browser there is no map to open.
 */
export function canOpenMap(): boolean {
  return isGranted('map.openPlace');
}

/**
 * Close this page and open the campus map on one place, sheet up. `place` is
 * `[<kind>:]<placeId>` — `event:<placeId>` for a festival place — the same
 * string as the app's `skkuverse://map?place=` link.
 */
export function openMapPlace(place: string): void {
  notify('map.openPlace', { place });
}

/** Whether the app can open another miniapp. */
export function canOpenMiniapp(): boolean {
  return isGranted('miniapp.open');
}

/** Open another registered miniapp. `target` is `<id>[/path]`, as in `skkuverse://m/<id>`. */
export function openMiniapp(target: string): void {
  notify('miniapp.open', { target });
}
