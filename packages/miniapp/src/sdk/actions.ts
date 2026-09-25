import { postToApp } from '../transport';
import { hasCapability } from './capabilities';

/**
 * Whether the host app can open its map on a place. A button that asks for it
 * must not be drawn otherwise: in a plain browser there is no map to open.
 */
export function canOpenMap(): boolean {
  return hasCapability('action.map');
}

/**
 * Ask the app to close this page and open its campus map on one place, with its
 * sheet up. `place` is `[<kind>:]<placeId>` — `event:<placeId>` for a festival
 * place — the same string as the app's `skkuverse://map?place=` link.
 *
 * The app only honours this from an origin on the server's BRIDGE_ORIGINS, so a
 * new deployment of a page needs its host added there first.
 */
export function openMapPlace(place: string): void {
  postToApp({ type: 'web:action', actionType: 'map', actionValue: place });
}

/** Whether the host app can open another miniapp. */
export function canOpenMiniapp(): boolean {
  return hasCapability('action.miniapp');
}

/**
 * Ask the app to open another registered miniapp. `target` is `<id>[/path]`,
 * the same grammar as the `skkuverse://m/<id>` deep link.
 */
export function openMiniapp(target: string): void {
  postToApp({ type: 'web:action', actionType: 'miniapp', actionValue: target });
}
