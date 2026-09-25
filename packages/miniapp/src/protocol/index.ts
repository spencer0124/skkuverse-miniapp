/**
 * The web↔app bridge contract, and nothing else: no DOM, no React, no runtime
 * beyond one constant. Safe to import from the React Native host and from a
 * server.
 *
 * `v1.ts` is the wire format every shipped app build speaks. It is this repo's
 * source of truth and is registered as a cross-repo contract in the umbrella's
 * `contracts/manifest.json`, which the app and skkuverse-web vendor byte for
 * byte. Change it here first, and additively only: an old app build meets a new
 * page every day.
 */
export type { AppToWebMessage, WebToAppMessage, MapSelectPayload } from './v1';
export {
  CAPABILITIES,
  type Capability,
  type HostBridgeGlobal,
  type V2Request,
  type V2Response,
  type V2Error,
  type V2Event,
} from './v2';
