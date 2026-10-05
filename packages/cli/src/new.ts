import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ID_PATTERN } from './check.ts';

/** The placeholder every template file uses for the miniapp id. */
const PLACEHOLDER = /__ID__/g;

/** Copies `templates/miniapp` to `apps/<id>` with the id filled in. */
export function scaffold(root: string, id: string): string {
  if (!ID_PATTERN.test(id)) throw new Error(`id "${id}" must match ${ID_PATTERN}`);
  const dir = join(root, 'apps', id);
  if (existsSync(dir)) throw new Error(`apps/${id} already exists`);
  cpSync(join(root, 'templates', 'miniapp'), dir, { recursive: true });
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
