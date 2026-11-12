/**
 * Build, check and deploy one miniapp or game: the only way a package reaches
 * its host.
 *
 * Production deploys come from a clean `main` that matches `origin/main`, so
 * every production deployment is a commit anyone can check out. A preview
 * deploys whatever is in the tree and says so (`--commit-dirty`).
 *
 * The deploy runs from a staging copy of `dist/` with the platform's
 * `_headers` and `_redirects` written in, the miniapp or the game set by kind.
 * Wrangler uploads a `functions/` directory from its working directory, not
 * from the uploaded folder, so a static package deploys from an empty temp
 * directory and only a miniapp's declared B1 backend deploys from its own
 * package directory. A game never does (G3).
 */
import { spawnSync, type SpawnSyncOptions } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkApp, checkIdNamespace } from './check.ts';
import { entryOf, FOLDER, hostFor, loadConfig, type AppConfig, type Kind } from './config.ts';
import { platformFiles } from './platform.ts';
import { report } from './report.ts';

export interface ShipOptions {
  preview: boolean;
}

/** Everything `ship` decides from the id and the repository, before it runs anything. */
export interface DeployPlan {
  id: string;
  kind: Kind;
  /** The package directory. */
  dir: string;
  /** The `pnpm --filter` selector that builds it. */
  filter: string;
  config: AppConfig;
  host: string;
  /** The platform files written into the staged site. */
  files: Readonly<Record<string, string>>;
  /** Whether wrangler runs from the package (a B1 backend) or from the empty staging directory. */
  cwd: 'package' | 'stage';
}

/** Resolves the id to its kind from `deploy.config.json`; an id under both sections is refused (G1). */
export function planDeploy(root: string, id: string): DeployPlan {
  const config = loadConfig(root);
  const app = entryOf(config, 'app', id);
  const game = entryOf(config, 'game', id);
  if (app && game) throw new Error(`${id} is under both "apps" and "games" in deploy.config.json (G1)`);
  const entry = app ?? game;
  if (!entry) throw new Error(`${id} is not in deploy.config.json`);
  const kind: Kind = app ? 'app' : 'game';
  return {
    id,
    kind,
    dir: join(root, FOLDER[kind], id),
    filter: `./${FOLDER[kind]}/${id}`,
    config: entry,
    host: hostFor(id, entry, kind),
    files: platformFiles(kind),
    cwd: kind === 'app' && entry.backend === 'functions' ? 'package' : 'stage',
  };
}

/** Copies `dist/` to `site` and writes the platform files in. */
export function stageSite(dist: string, site: string, files: DeployPlan['files']): void {
  cpSync(dist, site, { recursive: true });
  for (const [name, content] of Object.entries(files)) writeFileSync(join(site, name), content);
}

export function ship(root: string, id: string, { preview }: ShipOptions): void {
  const plan = planDeploy(root, id);
  const { kind, dir, config } = plan;

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

  run('pnpm', ['--filter', plan.filter, 'run', 'build'], { cwd: root });
  const findings = checkApp({ id, dir, kind, config });
  if (kind === 'game') findings.push(...checkIdNamespace(root, id, dir, loadConfig(root)));
  if (!report(id, findings)) throw new Error(`${id} does not pass the check`);

  const stage = mkdtempSync(join(tmpdir(), `skkuverse-mini-${id}-`));
  try {
    const site = join(stage, 'site');
    stageSite(join(dir, 'dist'), site, plan.files);

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
      { cwd: plan.cwd === 'package' ? dir : stage },
    );
    console.log(
      preview
        ? `\n${id}: preview deployed to https://preview.${config.project}.pages.dev`
        : `\n${id}: deployed to https://${plan.host}`,
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
