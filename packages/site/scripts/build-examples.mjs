import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { resolveConfig } from 'vitepress';

const siteDir = path.join(import.meta.dirname, '..');
const examplesDir = path.join(siteDir, '../../examples');

const { site, outDir } = await resolveConfig(siteDir, 'build', 'production');

for (const name of fs.readdirSync(examplesDir).sort()) {
  const dir = path.join(examplesDir, name);
  if (!fs.existsSync(path.join(dir, 'package.json'))) continue;
  const npm = (...args) => execFileSync('npm', args, { cwd: dir, stdio: 'inherit' });
  npm('ci', '--no-audit', '--no-fund');
  npm('run', 'build', '--', '--base', `${site.base}examples/${name}/`, '--outDir', path.join(outDir, 'examples', name), '--emptyOutDir');
  console.log(`build-examples: ${name} -> ${path.relative(siteDir, path.join(outDir, 'examples', name))}`);
}
