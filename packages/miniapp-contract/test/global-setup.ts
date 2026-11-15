import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { build, type Plugin } from 'vite';

const pkg = resolve(import.meta.dirname, '..');
const fixtures = join(pkg, 'test', 'fixtures');
const template = resolve(pkg, '../cli/templates/miniapp');
/** Where the template's build goes: outside `templates/`, which `new` copies whole. */
export const TEMPLATE_BUILD = join(pkg, 'node_modules', '.cache', 'miniapp-contract', 'template');

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, { cwd: pkg, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} exited ${result.status}\n${result.stdout}${result.stderr}`);
}

/** Resolves a bare import from a folder with no node_modules of its own as if this package made it. */
const fromHere: Plugin = {
  name: 'resolve-from-this-package',
  async resolveId(source, importer, options) {
    if (importer === undefined || importer.startsWith(pkg) || /^[./\0]/.test(source)) return null;
    return this.resolve(source, join(pkg, 'package.json'), { ...options, skipSelf: true });
  },
};

async function buildPage(root: string, outDir: string): Promise<void> {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    base: '/',
    cacheDir: join(pkg, 'node_modules', '.vite'),
    plugins: [fromHere],
    build: { outDir, emptyOutDir: true },
  });
}

export default async function setup(): Promise<void> {
  // `pnpm --filter @skkuverse/miniapp-contract test` skips turbo's `^build`, and the runner imports the CLI's and the SDK's builds.
  run('pnpm', ['exec', 'turbo', 'run', 'build', '--filter=@skkuverse/miniapp-contract...', '--output-logs=errors-only']);
  run(process.execPath, [join(pkg, 'dist', 'cli.js'), 'install']);
  // vitest sets NODE_ENV to test, and vite builds with import.meta.env.DEV true unless it is production.
  const nodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    for (const entry of readdirSync(fixtures, { withFileTypes: true })) {
      if (entry.isDirectory()) await buildPage(join(fixtures, entry.name), join(fixtures, entry.name, 'dist'));
    }
    await buildPage(template, join(TEMPLATE_BUILD, 'dist'));
  } finally {
    if (nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
  }
}
