/**
 * `./protocol` as a CommonJS consumer gets it: the package built, packed,
 * installed under node_modules of a project outside this repository, and loaded
 * with `require`. A server that is still CommonJS imports the manifest parser
 * this way. An exports map that lists only the `import` condition makes Node
 * answer ERR_PACKAGE_PATH_NOT_EXPORTED here, and nothing else in this suite
 * resolves the package through its exports map.
 *
 * Only the protocol entry is built, into a scratch copy of the manifest, so the
 * test does not depend on `dist/` being built or race a build that is running.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build } from 'tsup';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as protocol from '../src/protocol';

const pkg = resolve(import.meta.dirname, '..');
const scratch = mkdtempSync(join(tmpdir(), 'miniapp-require-protocol-'));
const consumer = join(scratch, 'consumer');
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

function run(command: string, args: string[], cwd: string) {
  return spawnSync(command, args, { cwd, encoding: 'utf8' });
}

function runOk(command: string, args: string[], cwd: string): string {
  const result = run(command, args, cwd);
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited ${result.status}\n${result.stdout}${result.stderr}`);
  }
  return result.stdout;
}

beforeAll(async () => {
  const stage = join(scratch, 'stage');
  mkdirSync(stage);
  // The real exports map, with the workspace dependencies left out: the protocol entry imports no package.
  const manifest = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8')) as Record<string, unknown>;
  for (const field of ['dependencies', 'peerDependencies', 'peerDependenciesMeta', 'scripts', 'devDependencies']) {
    delete manifest[field];
  }
  writeFileSync(join(stage, 'package.json'), JSON.stringify(manifest));
  await build({
    entry: { 'protocol/index': join(pkg, 'src/protocol/index.ts') },
    outDir: join(stage, 'dist'),
    format: ['esm'],
    target: 'es2022',
    config: false,
    silent: true,
  });

  const out = join(scratch, 'pack');
  mkdirSync(out);
  runOk('npm', ['pack', '--pack-destination', out, '--silent'], stage);
  const [tarball] = readdirSync(out);
  if (!tarball) throw new Error('npm pack wrote nothing');

  mkdirSync(consumer);
  writeFileSync(
    join(consumer, 'package.json'),
    JSON.stringify({ name: 'consumer', private: true, dependencies: { '@skkuverse/miniapp': `file:${join(out, tarball)}` } }),
  );
  runOk('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--offline'], consumer);
}, 120_000);

const exportedNames = Object.keys(protocol).sort();

describe('@skkuverse/miniapp/protocol installed from its tarball', () => {
  it('loads with require and exports what the source exports', () => {
    writeFileSync(
      join(consumer, 'load.cjs'),
      `const p = require('@skkuverse/miniapp/protocol');
console.log(JSON.stringify({ names: Object.keys(p).sort(), parseManifest: typeof p.parseManifest }));
`,
    );
    const result = run(process.execPath, ['load.cjs'], consumer);
    expect(result.stderr).not.toContain('ERR_PACKAGE_PATH_NOT_EXPORTED');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ names: exportedNames, parseManifest: 'function' });
  });

  it('loads with import and exports the same names', () => {
    writeFileSync(
      join(consumer, 'load.mjs'),
      `const p = await import('@skkuverse/miniapp/protocol');
console.log(JSON.stringify(Object.keys(p).sort()));
`,
    );
    const result = run(process.execPath, ['load.mjs'], consumer);
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual(exportedNames);
  });
});
