import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Finding } from '../rules.ts';
import { RunnerError, type Session, type Visit } from '../session.ts';

const READS_QUERY = /URLSearchParams|searchParams|location\.search/;
const KEY_READ = /\.(?:get|getAll|has)\(\s*(["'`])([^"'`\\$]{1,64})\1\s*\)/g;
/** The values each key is loaded with: one a number reads, one a flag compared to "true" reads. */
const VALUES = ['1', 'true'];

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

const snapshot = (visit: Visit) => ({ text: visit.text, posted: JSON.stringify(visit.posted), requests: [...visit.requests].sort() });

type Snapshot = ReturnType<typeof snapshot>;

function firstNewLine(base: string, text: string): string {
  const seen = new Set(base.split('\n'));
  const line = text.split('\n').find((l) => !seen.has(l)) ?? '';
  return line.length > 60 ? `${line.slice(0, 57)}...` : line;
}

/** What the page does differently in `other` than in `base`, or undefined when nothing differs. */
function difference(base: Snapshot, other: Snapshot): string | undefined {
  if (other.text !== base.text) return `shows other text ("${firstNewLine(base.text, other.text)}")`;
  if (other.posted !== base.posted) return 'posts other messages to the host';
  if (other.requests.join('\n') === base.requests.join('\n')) return undefined;
  const changed = other.requests.find((r) => !base.requests.includes(r)) ?? base.requests.find((r) => !other.requests.includes(r));
  return `requests other addresses (${changed ?? 'the same ones, a different number of times'})`;
}

export async function judgeN2(session: Session, keys: readonly string[]): Promise<Finding[]> {
  if (keys.length === 0) return [];
  const plain = snapshot(await session.visit('/', { host: true, click: false }));
  const unstable = difference(plain, snapshot(await session.visit('/', { host: true, click: false })));
  if (unstable !== undefined) {
    throw new RunnerError(`two plain loads of / differ: the second one ${unstable} than the first, so N2 cannot compare a load with a query key against one`);
  }
  const findings: Finding[] = [];
  for (const key of keys) {
    for (const value of VALUES) {
      const query = `?${encodeURIComponent(key)}=${value}`;
      const what = difference(plain, snapshot(await session.visit(`/${query}`, { host: true, click: false })));
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
