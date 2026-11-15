/**
 * Serves a built miniapp the way its host does: the files of `dist/`, the
 * headers `ship` writes into `_headers`, and the single-page fallback of
 * `_redirects`. Both files come from `@skkuverse/miniapp-cli/platform`, so
 * the page runs under the production CSP and nothing here restates it.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, normalize, sep } from 'node:path';
import { platformFiles } from '@skkuverse/miniapp-cli/platform';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wasm': 'application/wasm',
};

interface HeaderRule {
  pattern: string;
  headers: [string, string][];
}

/** A `_headers` file: a path pattern on its own line, then its headers indented under it. */
function parseHeaders(text: string): HeaderRule[] {
  const rules: HeaderRule[] = [];
  for (const line of text.split('\n')) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      rules.push({ pattern: line.trim(), headers: [] });
      continue;
    }
    const at = line.indexOf(':');
    rules.at(-1)?.headers.push([line.slice(0, at).trim(), line.slice(at + 1).trim()]);
  }
  return rules;
}

/** A Pages path pattern, where `*` matches anything, `/` included. */
function matches(pattern: string, path: string): boolean {
  const source = pattern.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${source}$`).test(path);
}

/** The rewrites of a `_redirects` file that answer 200: `<from> <to> 200`. */
function parseRewrites(text: string): { from: string; to: string }[] {
  return text
    .split('\n')
    .map((line) => line.trim().split(/\s+/))
    .filter(([from, to, status]) => from && to && status === '200')
    .map(([from, to]) => ({ from: from!, to: to! }));
}

const { _headers, _redirects } = platformFiles('app');
const HEADER_RULES = parseHeaders(_headers);
const REWRITES = parseRewrites(_redirects);

/** The file under `dist` a path names: the file itself, then `index.html` in a folder of that name. */
function fileFor(dist: string, path: string): string | undefined {
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return undefined;
  }
  const file = normalize(join(dist, decoded));
  if (file !== dist && !file.startsWith(dist + sep)) return undefined;
  for (const candidate of [file, join(file, 'index.html')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return undefined;
}

/** What the host sends for a path: the file and the headers, or nothing for a 404. */
export function resolve(dist: string, path: string): { file: string; headers: Record<string, string> } | undefined {
  let file = fileFor(dist, path);
  for (const { from, to } of REWRITES) {
    if (file === undefined && matches(from, path)) file = fileFor(dist, to);
  }
  if (file === undefined) return undefined;
  const headers: Record<string, string> = { 'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream' };
  for (const rule of HEADER_RULES) {
    if (matches(rule.pattern, path)) for (const [name, value] of rule.headers) headers[name] = value;
  }
  return { file, headers };
}

export interface Served {
  server: Server;
  /** The origin the page is served on, such as `http://127.0.0.1:53124`. */
  origin: string;
}

/** Serves `dist` on 127.0.0.1, on `port` or on any free port. */
export function serve(dist: string, port = 0): Promise<Served> {
  const root = normalize(dist);
  const server = createServer((request, response) => {
    const path = new URL(request.url ?? '/', 'http://localhost').pathname;
    const found = request.method === 'GET' || request.method === 'HEAD' ? resolve(root, path) : undefined;
    if (found === undefined) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('not found');
      return;
    }
    response.writeHead(200, found.headers).end(request.method === 'HEAD' ? undefined : readFileSync(found.file));
  });
  return new Promise((done, fail) => {
    server.once('error', fail);
    server.listen(port, '127.0.0.1', () => {
      const { port: bound } = server.address() as AddressInfo;
      done({ server, origin: `http://127.0.0.1:${bound}` });
    });
  });
}
