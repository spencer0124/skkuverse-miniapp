/**
 * skkuverse-mini's operator CLI. Run from the repository root through the root
 * package scripts:
 *
 *   pnpm check [<id>...]            every miniapp, or the ones named
 *   pnpm check --dir <path> --id <id>   a miniapp outside apps/ (a club's submission)
 *   pnpm ship <id> [--preview]      build, check and deploy
 *   pnpm new <id>                   scaffold apps/<id> from templates/miniapp
 */
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { checkApp } from './check.ts';
import { loadConfig } from './config.ts';
import { scaffold } from './new.ts';
import { report } from './report.ts';
import { ship } from './ship.ts';

const root = resolve(import.meta.dirname, '..', '..', '..');

function main(argv: string[]): number {
  const [command, ...rest] = argv;
  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      dir: { type: 'string' },
      id: { type: 'string' },
      preview: { type: 'boolean', default: false },
    },
  });

  switch (command) {
    case 'check': {
      if (values.dir !== undefined) {
        if (values.id === undefined) throw new Error('--dir needs --id');
        return report(values.id, checkApp({ id: values.id, dir: resolve(values.dir), config: null })) ? 0 : 1;
      }
      const config = loadConfig(root);
      const ids = positionals.length > 0 ? positionals : listApps();
      let ok = true;
      for (const id of ids) {
        const dir = join(root, 'apps', id);
        if (!existsSync(dir)) throw new Error(`apps/${id} does not exist`);
        const entry = config.apps[id];
        const findings = checkApp({ id, dir, config: entry ?? null });
        if (!entry) findings.push({ rule: 'R4', level: 'error', message: 'not in deploy.config.json' });
        ok = report(id, findings) && ok;
      }
      for (const id of Object.keys(config.apps)) {
        if (!existsSync(join(root, 'apps', id))) {
          console.log(`✗ ${id} R4 deploy.config.json lists it but apps/${id} does not exist`);
          ok = false;
        }
      }
      return ok ? 0 : 1;
    }
    case 'ship': {
      const [id] = positionals;
      if (id === undefined || positionals.length > 1) throw new Error('usage: ship <id> [--preview]');
      ship(root, id, { preview: values.preview });
      return 0;
    }
    case 'new': {
      const [id] = positionals;
      if (id === undefined || positionals.length > 1) throw new Error('usage: new <id>');
      const dir = scaffold(root, id);
      console.log(`created ${dir}`);
      console.log(`next: add "${id}" to deploy.config.json, pnpm install, then register it in skkuverse-server`);
      return 0;
    }
    default:
      throw new Error('usage: check [<id>...] | check --dir <path> --id <id> | ship <id> [--preview] | new <id>');
  }
}

function listApps(): string[] {
  return readdirSync(join(root, 'apps'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
