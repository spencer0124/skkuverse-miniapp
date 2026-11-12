import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';
import {
  CONTENT_SECURITY_POLICY,
  GAME_CONTENT_SECURITY_POLICY,
  GAME_HEADERS_FILE,
  HEADERS_FILE,
  REDIRECTS_FILE,
  platformFiles,
} from '../src/platform.ts';
import { planDeploy, ship, stageSite } from '../src/ship.ts';

/**
 * `git rebase -x` and git hooks export GIT_DIR and its kin, and every git this
 * file starts, the tests' own and the one inside `ship`, would act on that
 * repository instead of the throwaway one. The variables go, for this process only.
 */
for (const name of Object.keys(process.env)) if (name.startsWith('GIT_')) delete process.env[name];

const scratch = mkdtempSync(join(tmpdir(), 'miniapp-cli-ship-test-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

function write(dir: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
}

/** A repository root holding only its deploy config: planning reads nothing else. */
function repo(config: unknown): string {
  const root = mkdtempSync(join(scratch, 'root-'));
  write(root, { 'deploy.config.json': JSON.stringify(config) });
  return root;
}

describe('ship', () => {
  // The miniapp headers as they were before games existed: a change here
  // changes every deployed miniapp.
  const APP_HEADERS = `/*
  Content-Security-Policy: script-src 'self'; object-src 'none'; base-uri 'self'

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;
  const GAME_HEADERS = `/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; media-src 'self' data:; frame-src 'none'; object-src 'none'; base-uri 'self'

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;
  const REDIRECTS = '/*    /index.html   200\n';

  it('writes the miniapp headers unchanged, and the game headers for a game', () => {
    assert.equal(HEADERS_FILE, APP_HEADERS);
    assert.equal(GAME_HEADERS_FILE, GAME_HEADERS);
    assert.equal(REDIRECTS_FILE, REDIRECTS);
    assert.deepEqual(platformFiles('app'), { _headers: APP_HEADERS, _redirects: REDIRECTS });
    assert.deepEqual(platformFiles('game'), { _headers: GAME_HEADERS, _redirects: REDIRECTS });
  });

  it('closes frames for a game only', () => {
    assert.match(GAME_CONTENT_SECURITY_POLICY, /(?:^|; )frame-src 'none'(?:;|$)/);
    assert.doesNotMatch(CONTENT_SECURITY_POLICY, /frame-src/);
  });

  it('plans a miniapp as before', () => {
    const root = repo({ apps: { inja: { project: 'miniapp-inja', backend: 'functions' }, mukja: { project: 'miniapp-mukja' } } });
    const inja = planDeploy(root, 'inja');
    assert.equal(inja.kind, 'app');
    assert.equal(inja.dir, join(root, 'apps', 'inja'));
    assert.equal(inja.filter, './apps/inja');
    assert.equal(inja.config.project, 'miniapp-inja');
    assert.equal(inja.host, 'inja.mini.skkuverse.com');
    assert.equal(inja.cwd, 'package');
    assert.equal(inja.files._headers, APP_HEADERS);
    assert.equal(planDeploy(root, 'mukja').cwd, 'stage');
  });

  it('plans a game onto game-<id> at <id>.game.skkuverse.com with the game headers, never from its folder', () => {
    const root = repo({ apps: {}, games: { apple: { project: 'game-apple', backend: 'functions' } } });
    const plan = planDeploy(root, 'apple');
    assert.equal(plan.kind, 'game');
    assert.equal(plan.dir, join(root, 'games', 'apple'));
    assert.equal(plan.filter, './games/apple');
    assert.equal(plan.config.project, 'game-apple');
    assert.equal(plan.host, 'apple.game.skkuverse.com');
    assert.equal(plan.cwd, 'stage');
    assert.equal(plan.files._headers, GAME_HEADERS);
  });

  it('refuses an id under both sections, or under neither', () => {
    const root = repo({ apps: { x: { project: 'miniapp-x' } }, games: { x: { project: 'game-x' } } });
    assert.throws(() => planDeploy(root, 'x'), /G1/);
    assert.throws(() => planDeploy(root, 'y'), /not in deploy\.config\.json/);
  });

  it('plans an id that names a property every object inherits', () => {
    const root = repo({ apps: { constructor: { project: 'miniapp-constructor' } }, games: {} });
    assert.equal(planDeploy(root, 'constructor').kind, 'app');
    assert.throws(() => planDeploy(root, 'toString'), /not in deploy\.config\.json/);
  });

  it('stages the build with the platform files written byte for byte', () => {
    for (const kind of ['app', 'game'] as const) {
      const dist = join(mkdtempSync(join(scratch, 'dist-')), 'dist');
      write(dist, { 'index.html': '<!doctype html>', 'assets/index-AbCd1234.js': 'x' });
      const site = join(mkdtempSync(join(scratch, 'stage-')), 'site');
      stageSite(dist, site, platformFiles(kind));
      assert.equal(readFileSync(join(site, '_headers'), 'utf8'), kind === 'app' ? APP_HEADERS : GAME_HEADERS);
      assert.equal(readFileSync(join(site, '_redirects'), 'utf8'), REDIRECTS);
      assert.equal(readFileSync(join(site, 'assets', 'index-AbCd1234.js'), 'utf8'), 'x');
      assert.ok(!existsSync(join(dist, '_headers')));
    }
  });

  describe('the production guard', () => {
    /**
     * A git repository on `main` holding one registered miniapp, with stand-ins
     * for pnpm and wrangler that only leave a mark: a refusal must come before
     * either runs, so nothing builds and nothing reaches Cloudflare.
     */
    function shipRepo(branch = 'main'): { root: string; marks: string } {
      const root = repo({ apps: { mukja: { project: 'miniapp-mukja' } } });
      const marks = join(root, '.marks');
      const stub = `#!/bin/sh\necho "$0 $*" >> "${marks}"\n`;
      write(root, { '.gitignore': 'node_modules/\n.bin/\n.marks\n', 'node_modules/.bin/wrangler': stub, '.bin/pnpm': stub });
      chmodSync(join(root, 'node_modules', '.bin', 'wrangler'), 0o755);
      chmodSync(join(root, '.bin', 'pnpm'), 0o755);
      const git = (...args: string[]) => {
        const result = spawnSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.com', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args], { cwd: root, encoding: 'utf8' });
        assert.equal(result.status, 0, result.stderr);
      };
      git('init', '--quiet', '--initial-branch', branch);
      git('add', '.');
      git('commit', '--quiet', '-m', 'init');
      return { root, marks };
    }

    function withStubPath<T>(root: string, fn: () => T): T {
      const path = process.env.PATH;
      process.env.PATH = `${join(root, '.bin')}${delimiter}${path ?? ''}`;
      try {
        return fn();
      } finally {
        process.env.PATH = path;
      }
    }

    it('refuses a production deploy from a dirty tree, before building or calling Cloudflare', () => {
      const { root, marks } = shipRepo();
      write(root, { 'apps/mukja/src/main.tsx': 'uncommitted' });
      withStubPath(root, () => {
        assert.throws(() => ship(root, 'mukja', { preview: false }), /production deploys from a clean tree/);
      });
      assert.ok(!existsSync(marks), existsSync(marks) ? readFileSync(marks, 'utf8') : '');
    });

    it('refuses a production deploy from a branch other than main, before anything runs', () => {
      const { root, marks } = shipRepo('dev');
      withStubPath(root, () => {
        assert.throws(() => ship(root, 'mukja', { preview: false }), /production deploys from main; this is dev/);
      });
      assert.ok(!existsSync(marks));
    });
  });
});
