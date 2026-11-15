import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const SENTINEL = '__SKKUVERSE_DEV_HOST__';
const pkg = fileURLToPath(new URL('..', import.meta.url));
const repo = join(pkg, '../..');
const template = join(repo, 'packages/cli/templates/miniapp');

function packageRoot(name: string, resolved: string): string {
  let dir = dirname(resolved);
  while (!existsSync(join(dir, 'package.json')) || (JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { name?: string }).name !== name) {
    dir = dirname(dir);
  }
  return dir;
}

let scratch: string;
let app: string;

function filesHolding(dir: string, text: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((file) => statSync(file).size > 0 && readFileSync(file, 'utf8').includes(text));
}

// The workspace pins esbuild 0.28.2 over vite 6, which asks for 0.25, and 0.28 refuses to lower
// destructuring to Vite's default target (safari14). A scaffolded repository resolves vite's own esbuild.
function build(config: string, outDir: string): void {
  const args = ['build', '--config', config, '--outDir', outDir, '--target', 'es2022'];
  execFileSync(process.execPath, [join(packageRoot('vite', require.resolve('vite')), 'bin/vite.js'), ...args], {
    cwd: app,
    stdio: 'pipe',
  });
}

beforeAll(() => {
  scratch = mkdtempSync(join(tmpdir(), 'vite-plugin-footprint-'));
  app = join(scratch, 'apps/demo');
  cpSync(template, app, { recursive: true });
  cpSync(join(repo, 'tsconfig.base.json'), join(scratch, 'tsconfig.base.json'));
  for (const file of ['index.html', 'src/main.tsx', 'src/App.tsx']) {
    writeFileSync(join(app, file), readFileSync(join(app, file), 'utf8').replaceAll('__ID__', 'demo'));
  }
  const links: Record<string, string> = {
    vite: packageRoot('vite', require.resolve('vite')),
    '@vitejs/plugin-react': packageRoot('@vitejs/plugin-react', require.resolve('@vitejs/plugin-react')),
    react: packageRoot('react', require.resolve('react')),
    'react-dom': packageRoot('react-dom', require.resolve('react-dom')),
    '@skkuverse/miniapp': join(pkg, 'node_modules/@skkuverse/miniapp'),
    '@skkuverse/vite-plugin-miniapp': pkg,
  };
  for (const [name, target] of Object.entries(links)) {
    mkdirSync(dirname(join(scratch, 'node_modules', name)), { recursive: true });
    symlinkSync(realpathSync(target), join(scratch, 'node_modules', name));
  }
  const config = readFileSync(join(app, 'vite.config.ts'), 'utf8');
  expect(config).toContain('skkuverseDevHost()');
  writeFileSync(join(app, 'vite.forced.config.ts'), config.replace('skkuverseDevHost()', "skkuverseDevHost({ inject: 'always' })"));
  build('vite.config.ts', 'dist');
  build('vite.forced.config.ts', 'dist-forced');
}, 120_000);

afterAll(() => rmSync(scratch, { recursive: true, force: true }));

describe('the dev host in a build of the miniapp template', () => {
  it('leaves no trace in the default build', () => {
    expect(filesHolding(join(app, 'dist'), SENTINEL)).toEqual([]);
    expect(filesHolding(join(app, 'dist'), 'skkuverse-dev-host')).toEqual([]);
  });

  it('puts the host in a build made with inject always, which is the positive control', () => {
    expect(filesHolding(join(app, 'dist-forced'), SENTINEL).length).toBeGreaterThanOrEqual(1);
  });

  it('loads the forced host first, from a hashed root-absolute script', () => {
    const html = readFileSync(join(app, 'dist-forced/index.html'), 'utf8');
    const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((m) => m[1]!);
    expect(scripts[0]).toMatch(/^\/assets\/skkuverse-dev-host-[\w-]{8}\.js$/);
    expect(scripts.length).toBeGreaterThan(1);
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>\s*\S/);
  });
});
