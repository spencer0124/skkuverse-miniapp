/**
 * N2: a debug switch works only under `import.meta.env.DEV`. The production
 * bundle is searched for the query keys it reads (`URLSearchParams`,
 * `searchParams.get`, `location.search`), and the page is loaded with each
 * key set. Fails on a key whose load posts other messages, or shows other
 * text, than the plain load.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Finding } from '../rules.ts';
import { RunnerError, type Session, type Visit } from '../session.ts';

const READS_QUERY = /URLSearchParams|searchParams|location\.search/;
const KEY_READ = /\.(?:get|getAll|has)\(\s*(["'`])([^"'`\\$]{1,64})\1\s*\)/g;
/** The values each key is loaded with: one a number reads, one a flag compared to "true" reads. */
const VALUES = ['1', 'true'];

/** The keys the built scripts under `dist` read from a query string. */
export function queryKeys(dist: string): string[] {
  const keys = new Set<string>();
  for (const name of readdirSync(dist, { recursive: true, encoding: 'utf8' })) {
    if (!/\.m?js$/.test(name)) continue;
    const source = readFileSync(join(dist, name), 'utf8');
    if (!READS_QUERY.test(source)) continue;
    for (const [, , key] of source.matchAll(KEY_READ)) keys.add(key!);
  }
  return [...keys].sort();
}

const snapshot = (visit: Visit) => ({ text: visit.text, posted: JSON.stringify(visit.posted) });

/** The first line of `text` that `base` lacks, cut short. */
function firstNewLine(base: string, text: string): string {
  const seen = new Set(base.split('\n'));
  const line = text.split('\n').find((l) => !seen.has(l)) ?? '';
  return line.length > 60 ? `${line.slice(0, 57)}...` : line;
}

export async function judgeN2(session: Session, keys: readonly string[]): Promise<Finding[]> {
  if (keys.length === 0) return [];
  const plain = snapshot(await session.visit('/', { host: true, click: false }));
  const again = snapshot(await session.visit('/', { host: true, click: false }));
  if (plain.text !== again.text || plain.posted !== again.posted) {
    throw new RunnerError('two plain loads of / differ, so N2 cannot compare a load with a query key against one');
  }
  const findings: Finding[] = [];
  for (const key of keys) {
    for (const value of VALUES) {
      const query = `?${encodeURIComponent(key)}=${value}`;
      const loaded = snapshot(await session.visit(`/${query}`, { host: true, click: false }));
      const what =
        loaded.text !== plain.text
          ? `shows other text ("${firstNewLine(plain.text, loaded.text)}")`
          : loaded.posted !== plain.posted
            ? 'posts other messages to the host'
            : undefined;
      if (what === undefined) continue;
      findings.push({
        rule: 'N2',
        level: 'error',
        message: `the production build reads the query key "${key}": with ${query} the page ${what} than without it. A debug switch must work only under import.meta.env.DEV`,
      });
      break;
    }
  }
  return findings;
}
