import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Finding } from '../rules.ts';
import { RunnerError, type Outbound, type Visit } from '../session.ts';

export const ENV_FILE = '.env.production';
const PREFLIGHT_TIMEOUT_MS = 10_000;
/** The methods CORS allows without naming them in `Access-Control-Allow-Methods`. */
const SIMPLE_METHODS = new Set(['GET', 'HEAD', 'POST']);

export function backendOrigins(dir: string): Set<string> {
  const file = join(dir, ENV_FILE);
  const origins = new Set<string>();
  if (!existsSync(file)) return origins;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = /^\s*(?:export\s+)?(VITE_[A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match) continue;
    const value = match[2]!.replace(/^(["'`])(.*)\1$/, '$2');
    const url = URL.parse(value);
    if (url?.protocol === 'https:' || url?.protocol === 'http:') origins.add(url.origin);
  }
  return origins;
}

export async function corsRefusal(request: Pick<Outbound, 'url' | 'method' | 'preflightHeaders'>, origin: string): Promise<string | undefined> {
  let response: Response;
  try {
    response = await fetch(request.url, {
      method: 'OPTIONS',
      redirect: 'manual',
      signal: AbortSignal.timeout(PREFLIGHT_TIMEOUT_MS),
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': request.method,
        ...(request.preflightHeaders.length > 0 ? { 'Access-Control-Request-Headers': request.preflightHeaders.join(',') } : {}),
      },
    });
  } catch (error) {
    const cause = error instanceof Error ? ((error.cause as Error | undefined)?.message ?? error.message) : String(error);
    throw new RunnerError(`the CORS preflight to ${new URL(request.url).origin} failed (${cause}), so N4 cannot judge it`);
  }
  const allowOrigin = response.headers.get('access-control-allow-origin');
  if (response.status < 200 || response.status > 299) return `its preflight answered ${response.status}`;
  if (allowOrigin !== origin && allowOrigin !== '*') return `Access-Control-Allow-Origin is ${allowOrigin === null ? 'missing' : `"${allowOrigin}"`}`;
  const list = (name: string) => (response.headers.get(name) ?? '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
  const methods = list('access-control-allow-methods');
  if (!SIMPLE_METHODS.has(request.method) && !methods.includes('*') && !methods.includes(request.method.toLowerCase())) {
    return `Access-Control-Allow-Methods does not allow ${request.method}`;
  }
  const headers = list('access-control-allow-headers');
  const missing = request.preflightHeaders.filter((h) => !headers.includes('*') && !headers.includes(h));
  if (missing.length > 0) return `Access-Control-Allow-Headers does not allow ${missing.join(', ')}`;
  return undefined;
}

export async function judgeN4(visits: readonly Visit[], allowed: ReadonlySet<string>, productionOrigin: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const reported = new Set<string>();
  const once = (key: string, message: string) => {
    if (reported.has(key)) return;
    reported.add(key);
    findings.push({ rule: 'N4', level: 'error', message });
  };
  const checked = new Map<string, Outbound>();
  for (const visit of visits) {
    for (const request of visit.outbound) {
      const origin = new URL(request.url).origin;
      if (!allowed.has(origin)) {
        once(`origin ${origin}`, `${request.trigger} called ${request.url}, an origin that no VITE_* value in ${ENV_FILE} names. Read the backend URL from import.meta.env`);
      } else if (!checked.has(origin)) {
        checked.set(origin, request);
      }
    }
    for (const { url, how, trigger } of visit.cookieAsks) {
      const origin = new URL(url).origin;
      once(
        `${how} ${origin}`,
        how === 'credentials'
          ? `${trigger} asked to send cookies to ${url} (credentials: 'include' or withCredentials). Authenticate with a token, because the iOS web view blocks third-party cookies`
          : `${trigger} set a Cookie header on a request to ${url}. Authenticate with a token, because the iOS web view blocks third-party cookies`,
      );
    }
  }
  for (const [origin, request] of checked) {
    const refused = await corsRefusal(request, productionOrigin);
    if (refused) once(`cors ${origin}`, `${origin} does not allow ${productionOrigin} through CORS: ${refused}`);
  }
  return findings;
}
