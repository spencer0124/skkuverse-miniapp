import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Each published entry promises what it does not pull in: `./protocol` has no
// dependencies at all, and `./react` must work without `@skkuverse/ui`
// installed. Both are checked on the source import graph, which is what the
// bundler follows.

const src = resolve(dirname(fileURLToPath(import.meta.url)), '../src');
const IMPORT = /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

function resolveLocal(from: string, spec: string): string {
  const base = resolve(dirname(from), spec);
  for (const candidate of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`cannot resolve ${spec} from ${from}`);
}

/** Every bare (package) import reachable from `entry`, following relative imports. */
function externalImports(entry: string): Set<string> {
  const seen = new Set<string>();
  const external = new Set<string>();
  const visit = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    for (const match of readFileSync(file, 'utf8').matchAll(IMPORT)) {
      const spec = (match[1] ?? match[2])!;
      if (spec.startsWith('.')) visit(resolveLocal(file, spec));
      else external.add(spec);
    }
  };
  visit(entry);
  return external;
}

describe('entry boundaries', () => {
  it('./protocol imports nothing', () => {
    expect([...externalImports(`${src}/protocol/index.ts`)]).toEqual([]);
  });

  it('. imports nothing', () => {
    expect([...externalImports(`${src}/index.ts`)]).toEqual([]);
  });

  it('./react never reaches @skkuverse/ui', () => {
    const deps = [...externalImports(`${src}/react/index.ts`)];
    expect(deps.filter((d) => d.startsWith('@skkuverse/ui'))).toEqual([]);
    expect(deps.sort()).toEqual(['@skkuverse/tokens', 'react', 'react/jsx-runtime'].filter((d) => deps.includes(d)).sort());
  });

  it('./react/ui is the only entry that imports @skkuverse/ui', () => {
    expect(externalImports(`${src}/react/ui/index.ts`).has('@skkuverse/ui')).toBe(true);
  });
});
