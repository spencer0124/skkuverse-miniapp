/**
 * The runner as a user gets it: packed, installed under the node_modules of a
 * project outside this repository, and started through its bin from that
 * project's folder. The other tests import `src/` and never see what changes
 * once the runner sits under node_modules. It installs twice: with pnpm, which
 * keeps the package and its dependencies under node_modules/.pnpm, and with
 * npm, which hoists them flat. Both installs fetch from the registry.
 */
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, relative, resolve } from 'node:path';
import { build } from 'tsup';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const repo = resolve(import.meta.dirname, '../../..');
const template = join(repo, 'packages/cli/templates/game');
const scratch = mkdtempSync(join(tmpdir(), 'game-contract-installed-'));
afterAll(() => {
  setWritable(scratch, true);
  rmSync(scratch, { recursive: true, force: true });
});

/** The contract run of a page whose runs end only when someone plays them, as a game ships it. */
const PLAYER = `export default {
  play(input: { press(): void }): void {
    input.press();
  },
};
`;

function run(command: string, args: string[], cwd: string): string {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited ${result.status}\n${result.stdout}${result.stderr}`);
  }
  return result.stdout;
}

/** Packs a workspace package the way it is published, `workspace:` ranges replaced. */
function pack(dir: string): string {
  const out = mkdtempSync(join(scratch, 'pack-'));
  run('pnpm', ['pack', '--pack-destination', out], join(repo, dir));
  const [tarball] = readdirSync(out);
  if (!tarball) throw new Error(`pnpm pack wrote nothing for ${dir}`);
  return join(out, tarball);
}

/** The game template bundled the way a game's build ships it: one module under dist/assets that index.html loads. */
async function buildTemplate(dist: string): Promise<void> {
  await build({
    entry: { index: join(template, 'src/main.ts') },
    outDir: join(dist, 'assets'),
    format: ['esm'],
    platform: 'browser',
    target: 'es2022',
    noExternal: [/.*/],
    config: false,
    silent: true,
  });
  const html = readFileSync(join(template, 'index.html'), 'utf8').replace('src="/src/main.ts"', 'src="/assets/index.js"');
  writeFileSync(join(dist, 'index.html'), html);
}

/** Every path under `dir`, so a test can see what a run left behind. */
function files(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' }).sort();
}

/** Takes away or gives back the write bit on every folder under `dir`, so no file can be created there. */
function setWritable(dir: string, writable: boolean): void {
  const folders = [dir, ...readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(entry.parentPath, entry.name))];
  for (const folder of folders) chmodSync(folder, writable ? 0o755 : 0o555);
}

let tarballs: { runner: string; sdk: string; tokens: string };
const built = join(scratch, 'built');

beforeAll(async () => {
  if (!existsSync(join(import.meta.dirname, '../dist/cli.js'))) throw new Error('build the package first: pnpm build');
  tarballs = {
    runner: pack('packages/game-contract'),
    sdk: pack('packages/miniapp'),
    tokens: pack('packages/tokens'),
  };
  await buildTemplate(built);
}, 120_000);

/** A project with two built games, `demo` and `played` (which ships a player), and the template's source. */
function install(layout: string, project: string): void {
  mkdirSync(project);
  writeFileSync(join(project, 'deploy.config.json'), JSON.stringify({ apps: {}, games: { demo: {}, played: {} } }));
  for (const id of ['demo', 'played']) cpSync(built, join(project, 'games', id, 'dist'), { recursive: true });
  cpSync(join(template, 'src'), join(project, 'games/demo/src'), { recursive: true });
  cpSync(join(template, 'index.html'), join(project, 'games/demo/index.html'));
  writeFileSync(join(project, 'games/played/contract.player.ts'), PLAYER);
  cpSync(join(import.meta.dirname, 'fixtures/double-over.ts'), join(project, 'broken/double-over.ts'));

  // The SDK and tokens come from this workspace, so the test does not depend on what npm holds.
  const local = { '@skkuverse/miniapp': `file:${tarballs.sdk}`, '@skkuverse/tokens': `file:${tarballs.tokens}` };
  const manifest = {
    name: 'consumer',
    private: true,
    type: 'module',
    devDependencies: { '@skkuverse/game-contract': `file:${tarballs.runner}` },
  };
  console.log(`installing with ${layout} ${run(layout, ['--version'], repo).trim()}`);
  if (layout === 'pnpm') {
    const { packageManager } = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8')) as { packageManager: string };
    writeFileSync(join(project, 'package.json'), JSON.stringify({ ...manifest, packageManager }));
    writeFileSync(join(project, 'pnpm-workspace.yaml'), `overrides:\n${Object.entries(local).map(([k, v]) => `  "${k}": "${v}"\n`).join('')}`);
    run('pnpm', ['install', '--ignore-scripts'], project);
  } else {
    writeFileSync(join(project, 'package.json'), JSON.stringify({ ...manifest, overrides: local }));
    run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], project);
  }
}

describe.each(['pnpm', 'npm'])('game-contract installed by %s', (layout) => {
  const project = join(scratch, layout);
  let pkg: string;
  let installed: string[];

  beforeAll(() => {
    install(layout, project);
    pkg = realpathSync(join(project, 'node_modules/@skkuverse/game-contract'));
    installed = files(pkg);
  }, 300_000);

  function contract(...args: string[]) {
    const result = spawnSync(join(project, 'node_modules/.bin/game-contract'), args, {
      cwd: project,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH ?? ''}` },
    });
    return { status: result.status, out: `${result.stdout}${result.stderr}` };
  }

  it('plays a built game by its id', () => {
    const { status, out } = contract('demo');
    expect(out).toContain('✓ 1 page(s) keep the game contract');
    expect(status).toBe(0);
  });

  it("plays a game's runs with its contract.player.ts", () => {
    const { status, out } = contract('played');
    expect(out).toContain('✓ 1 page(s) keep the game contract');
    // The template scores a press during a run; only the player presses then.
    expect(out).toMatch(/game\.over score=[1-9]/);
    expect(status).toBe(0);
  });

  it('plays a source entry that imports CSS and the SDK the project does not install', () => {
    const { status, out } = contract('--entry', 'games/demo/src/main.ts', '--html', 'games/demo/index.html');
    expect(out).toContain('✓ 1 page(s) keep the game contract');
    expect(status).toBe(0);
  });

  it('names the rule a broken page breaks', () => {
    const { status, out } = contract('--entry', 'broken/double-over.ts', '--html', 'games/demo/index.html', '--name', 'double-over');
    expect(out).toContain('one-over-per-run');
    expect(out).toContain('✗ broke the game contract: double-over; double-over, host after onNoHost');
    expect(status).toBe(1);
  });

  it('reports a page it could not load as a runner error, not as a broken contract', () => {
    const { status, out } = contract('--entry', 'games/demo/src/missing.ts', '--html', 'games/demo/index.html', '--name', 'missing');
    expect(out).toContain('✗ runner error, contract not checked: missing; missing, host after onNoHost');
    expect(out).not.toContain('broke the game contract');
    expect(status).toBe(2);
  });

  it('runs from a read-only install and leaves nothing in the package', () => {
    const modules = join(project, 'node_modules');
    setWritable(modules, false);
    try {
      // As root a folder without the write bit still takes new files, and this case would prove nothing.
      expect(() => writeFileSync(join(pkg, 'probe'), ''), 'the package folder refuses new files').toThrow(/EACCES/);
      const { status, out } = contract('demo', 'played');
      expect(out).toContain('✓ 2 page(s) keep the game contract');
      expect(status).toBe(0);
    } finally {
      setWritable(modules, true);
    }
    expect(files(pkg), `written under ${relative(project, pkg)}`).toEqual(installed);
  });
});
