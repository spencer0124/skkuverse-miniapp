import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Finding } from '../rules.ts';
import { backendOrigin, RunnerError, type Outbound, type Unjudged, type Visit } from '../session.ts';

export const ENV_FILE = '.env.production';
const CORS_TIMEOUT_MS = 10_000;
/** The methods CORS allows without naming them in `Access-Control-Allow-Methods`. */
const SIMPLE_METHODS = new Set(['GET', 'HEAD', 'POST']);

/** The Fetch spec's rule: a browser preflights a request only for a method or a header CORS does not allow by default. */
const needsPreflight = (request: Pick<Outbound, 'method' | 'preflightHeaders'>) => !SIMPLE_METHODS.has(request.method) || request.preflightHeaders.length > 0;

export function backendOrigins(dir: string): Set<string> {
  const file = join(dir, ENV_FILE);
  const origins = new Set<string>();
  if (!existsSync(file)) return origins;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = /^\s*(?:export\s+)?(VITE_[A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match) continue;
    const value = match[2]!.replace(/^(["'`])(.*)\1$/, '$2');
    const url = URL.parse(value);
    if (url && ['https:', 'http:', 'wss:', 'ws:'].includes(url.protocol)) origins.add(backendOrigin(url.href));
  }
  return origins;
}

async function send(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, redirect: 'manual', signal: AbortSignal.timeout(CORS_TIMEOUT_MS) });
  } catch (error) {
    const cause = error instanceof Error ? ((error.cause as Error | undefined)?.message ?? error.message) : String(error);
    throw new RunnerError(`the CORS check to ${new URL(url).origin} failed (${cause}), so N4 cannot judge it`);
  }
}

function originRefusal(response: Response, origin: string, answer: string): string | undefined {
  const allowOrigin = response.headers.get('access-control-allow-origin');
  if (allowOrigin === origin || allowOrigin === '*') return undefined;
  return `Access-Control-Allow-Origin is ${allowOrigin === null ? 'missing' : `"${allowOrigin}"`} ${answer}`;
}

/**
 * Asks the backend what a browser on `origin` would ask it. A request that
 * needs a preflight gets the preflight, and nothing else. A simple GET or HEAD
 * is sent as itself, since the browser judges CORS on its answer.
 */
async function corsRefusal(request: Pick<Outbound, 'url' | 'method' | 'preflightHeaders'>, origin: string): Promise<string | undefined> {
  if (!needsPreflight(request)) {
    const response = await send(request.url, { method: request.method, headers: { Origin: origin } });
    await response.body?.cancel();
    return originRefusal(response, origin, `in its answer to ${request.method}`);
  }
  const response = await send(request.url, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': request.method,
      ...(request.preflightHeaders.length > 0 ? { 'Access-Control-Request-Headers': request.preflightHeaders.join(',') } : {}),
    },
  });
  await response.body?.cancel();
  if (response.status < 200 || response.status > 299) return `its preflight answered ${response.status}`;
  const refused = originRefusal(response, origin, 'in its preflight answer');
  if (refused) return refused;
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
  const once = (key: string, message: string, level: Finding['level'] = 'error') => {
    if (reported.has(key)) return;
    reported.add(key);
    findings.push({ rule: 'N4', level, message });
  };
  const checked = new Map<string, Outbound>();
  for (const visit of visits) {
    for (const request of visit.outbound) {
      const origin = backendOrigin(request.url);
      if (!allowed.has(origin)) {
        const did = request.transport === 'websocket' ? 'opened a WebSocket to' : 'called';
        once(`origin ${origin}`, `${request.trigger} ${did} ${request.url}, an origin that no VITE_* value in ${ENV_FILE} names. Read the backend URL from import.meta.env`);
        continue;
      }
      if (request.transport === 'websocket') continue;
      const shape = `${origin} ${request.method} ${request.preflightHeaders.join(',')}`;
      if (!checked.has(shape)) checked.set(shape, request);
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
  for (const request of checked.values()) {
    const origin = backendOrigin(request.url);
    if (request.method === 'POST' && !needsPreflight(request)) {
      once(
        `unchecked ${origin} POST`,
        `did not check CORS for POST ${request.url}: a browser sends it with no preflight and judges CORS on the answer, so checking it means sending the write`,
        'warn',
      );
      continue;
    }
    const refused = await corsRefusal(request, productionOrigin);
    if (refused) once(`cors ${origin}`, `${origin} does not allow ${productionOrigin} through CORS: ${refused}`);
  }
  return findings;
}

/** A `warn` line for each connection the runner stopped without judging it, once per target. */
export function unjudgedFindings(unjudged: readonly Unjudged[]): Finding[] {
  const lines = new Map<string, string>();
  for (const stopped of unjudged) {
    const [key, message] =
      stopped.kind === 'refused'
        ? [
            `refused ${stopped.target}`,
            `${stopped.trigger} opened a connection to ${stopped.target} that the runner's routing did not see, such as a WebSocket from a Worker. The runner refused it and does not judge it`,
          ]
        : [
            `webrtc ${stopped.iceServers.join(' ')}`,
            stopped.iceServers.length > 0
              ? `${stopped.trigger} created an RTCPeerConnection with the ICE servers ${stopped.iceServers.join(', ')}. The runner lets WebRTC send no UDP, so no packet reached them, and does not judge them`
              : `${stopped.trigger} created an RTCPeerConnection. The runner lets WebRTC send no UDP and does not judge it`,
          ];
    if (!lines.has(key)) lines.set(key, message);
  }
  return [...lines.values()].map((message) => ({ rule: 'N4', level: 'warn', message }));
}
