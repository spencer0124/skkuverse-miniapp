/**
 * Build, check and deploy one miniapp: the only way a miniapp reaches its host.
 *
 * Production deploys come from a clean `main` that matches `origin/main`, so
 * every production deployment is a commit anyone can check out. A preview
 * deploys whatever is in the tree and says so (`--commit-dirty`).
 *
 * The deploy runs from a staging copy of `dist/` with the platform's
 * `_headers` and `_redirects` written in. Wrangler uploads a `functions/`
 * directory from its working directory, not from the uploaded folder, so a
 * static miniapp deploys from an empty temp directory and only a declared B1
 * backend deploys from its own package directory.
 */
import { spawnSync, type SpawnSyncOptions } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkApp } from './check.ts';
import { hostFor, loadConfig } from './config.ts';
import { HEADERS_FILE, REDIRECTS_FILE } from './platform.ts';
import { report } from './report.ts';

export interface ShipOptions {
  preview: boolean;
}

export function ship(root: string, id: string, { preview }: ShipOptions): void {
  const config = loadConfig(root).apps[id];
  if (!config) throw new Error(`${id} is not in deploy.config.json`);
  const dir = join(root, 'apps', id);

  const branch = git(root, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const dirty = git(root, ['status', '--porcelain']) !== '';
  if (!preview) {
    if (branch !== 'main') throw new Error(`production deploys from main; this is ${branch}`);
    if (dirty) throw new Error('production deploys from a clean tree; commit or stash first');
    run('git', ['fetch', '--quiet', 'origin', 'main'], { cwd: root });
    const head = git(root, ['rev-parse', 'HEAD']);
    const remote = git(root, ['rev-parse', 'origin/main']);
    if (head !== remote) throw new Error('main does not match origin/main; push or pull first');
  }

  run('pnpm', ['--filter', `./apps/${id}`, 'run', 'build'], { cwd: root });
  if (!report(id, checkApp({ id, dir, config }))) throw new Error(`${id} does not pass the check`);

  const stage = mkdtempSync(join(tmpdir(), `skkuverse-mini-${id}-`));
  try {
    const site = join(stage, 'site');
    cpSync(join(dir, 'dist'), site, { recursive: true });
    writeFileSync(join(site, '_headers'), HEADERS_FILE);
    writeFileSync(join(site, '_redirects'), REDIRECTS_FILE);

    const target = preview ? 'preview' : 'main';
    run(
      join(root, 'node_modules', '.bin', 'wrangler'),
      [
        'pages', 'deploy', site,
        '--project-name', config.project,
        '--branch', target,
        '--commit-hash', git(root, ['rev-parse', 'HEAD']),
        '--commit-message', git(root, ['log', '-1', '--format=%s']),
        `--commit-dirty=${dirty}`,
      ],
      { cwd: config.backend === 'functions' ? dir : stage },
    );
    console.log(
      preview
        ? `\n${id}: preview deployed to https://preview.${config.project}.pages.dev`
        : `\n${id}: deployed to https://${hostFor(id, config)}`,
    );
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

function git(cwd: string, args: string[]): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr.trim()}`);
  return result.stdout.trim();
}

function run(command: string, args: string[], options: SpawnSyncOptions): void {
  const result = spawnSync(command, args, { ...options, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${command} ${args.slice(0, 2).join(' ')} exited with ${result.status}`);
}
