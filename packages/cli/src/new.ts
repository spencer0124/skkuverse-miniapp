import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ID_PATTERN } from './check.ts';
import { FOLDER, KINDS, type Kind } from './config.ts';

/** The placeholder every template file uses for the package id. */
const PLACEHOLDER = /__ID__/g;

/** The template each kind is scaffolded from. */
export const TEMPLATE: Record<Kind, string> = { app: 'miniapp', game: 'game' };

/** The templates the package ships: `templates/` beside `src/` and `dist/`. */
export const TEMPLATES_DIR = resolve(import.meta.dirname, '..', 'templates');

/**
 * Copies the miniapp template to `apps/<id>`, or the game template to
 * `games/<id>`, with the id filled in. An id either kind already uses is
 * refused: the two share one namespace (spec G1).
 */
export function scaffold(root: string, id: string, kind: Kind = 'app'): string {
  if (!ID_PATTERN.test(id)) throw new Error(`id "${id}" must match ${ID_PATTERN}`);
  const dir = join(root, FOLDER[kind], id);
  if (existsSync(dir)) throw new Error(`${FOLDER[kind]}/${id} already exists`);
  for (const other of KINDS) {
    if (other !== kind && existsSync(join(root, FOLDER[other], id))) {
      throw new Error(`${FOLDER[other]}/${id} already uses the id (G1)`);
    }
  }
  cpSync(join(TEMPLATES_DIR, TEMPLATE[kind]), dir, { recursive: true });
  fill(dir, id);
  return dir;
}

function fill(dir: string, id: string): void {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      fill(path, id);
      continue;
    }
    const text = readFileSync(path, 'utf8');
    if (PLACEHOLDER.test(text)) writeFileSync(path, text.replace(PLACEHOLDER, id));
    PLACEHOLDER.lastIndex = 0;
  }
}
