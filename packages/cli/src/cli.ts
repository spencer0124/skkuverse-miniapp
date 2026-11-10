/**
 * skkuverse-mini's operator CLI. Run from the repository root through the root
 * package scripts:
 *
 *   pnpm check [<id>...] [--kind app|game]          every package, or the ones named
 *   pnpm check --dir <path> --id <id> [--kind game]  a package outside apps/ and games/ (a club's submission)
 *   pnpm ship <id> [--preview]                      build, check and deploy (the kind comes from deploy.config.json)
 *   pnpm new [--kind game] <id>                     scaffold apps/<id> from templates/miniapp, or games/<id> from templates/game
 */
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { checkApp, checkIdNamespace } from './check.ts';
import { loadConfig, parseKind } from './config.ts';
import { scaffold } from './new.ts';
import { report } from './report.ts';
import { checkRepo } from './repo.ts';
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
      kind: { type: 'string' },
      preview: { type: 'boolean', default: false },
    },
  });
  const kind = values.kind === undefined ? undefined : parseKind(values.kind);

  switch (command) {
    case 'check': {
      if (values.dir !== undefined) {
        if (values.id === undefined) throw new Error('--dir needs --id');
        const dir = resolve(values.dir);
        const k = kind ?? 'app';
        const findings = checkApp({ id: values.id, dir, kind: k, config: null });
        if (k === 'game') findings.push(...checkIdNamespace(root, values.id, dir, loadConfig(root)));
        return report(values.id, findings) ? 0 : 1;
      }
      let ok = true;
      const ids = positionals.length > 0 ? positionals : undefined;
      for (const { id, findings } of checkRepo(root, { ids, kind })) ok = report(id, findings) && ok;
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
      if (id === undefined || positionals.length > 1) throw new Error('usage: new [--kind game] <id>');
      const k = kind ?? 'app';
      const dir = scaffold(root, id, k);
      console.log(`created ${dir}`);
      console.log(
        k === 'app'
          ? `next: add "${id}" to deploy.config.json, pnpm install, then register it in skkuverse-server`
          : `next: add "${id}" to deploy.config.json "games" (project game-${id}), pnpm install, then list it in skkuverse-server's games dataset`,
      );
      return 0;
    }
    default:
      throw new Error(
        `usage: check [<id>...] [--kind app|game] | check --dir <path> --id <id> [--kind game] | ship <id> [--preview] | new [--kind game] <id>`,
      );
  }
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

