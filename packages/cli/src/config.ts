import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** One miniapp's line in `deploy.config.json`. */
export interface AppConfig {
  /** The Cloudflare Pages project `ship` deploys to. */
  project: string;
  /** Set only for an exception to `<id>.mini.skkuverse.com` (spec R4). */
  host?: string;
  /** Why the host is an exception. Required with `host`. */
  hostReason?: string;
  /** A first-party same-origin Functions backend (spec B1). */
  backend?: 'functions';
}

export interface DeployConfig {
  apps: Record<string, AppConfig>;
}

export const CONFIG_FILE = 'deploy.config.json';

export function hostFor(id: string, app: AppConfig | undefined): string {
  return app?.host ?? `${id}.mini.skkuverse.com`;
}

export function loadConfig(root: string): DeployConfig {
  const raw: unknown = JSON.parse(readFileSync(join(root, CONFIG_FILE), 'utf8'));
  if (typeof raw !== 'object' || raw === null || !('apps' in raw)) {
    throw new Error(`${CONFIG_FILE}: expected an object with "apps"`);
  }
  return raw as DeployConfig;
}
