import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { resolveConfig } from 'vitepress';

const siteDir = path.join(import.meta.dirname, '..');
const examplesDir = path.join(siteDir, '../../examples');

if (!fs.existsSync(examplesDir)) {
  console.error(`build-examples: no examples folder at ${examplesDir}`);
  process.exit(1);
}

const { site, outDir } = await resolveConfig(siteDir, 'build', 'production');

for (const name of fs.readdirSync(examplesDir).sort()) {
  const dir = path.join(examplesDir, name);
  if (!fs.existsSync(path.join(dir, 'package.json'))) continue;
  // WHY: npm is npm.cmd on Windows, which execFileSync runs only through a shell.
  const npm = (...args) => execFileSync('npm', args, { cwd: dir, stdio: 'inherit', shell: process.platform === 'win32' });
  npm('ci', '--no-audit', '--no-fund');
  npm('run', 'build', '--', '--base', `${site.base}examples/${name}/`, '--outDir', path.join(outDir, 'examples', name), '--emptyOutDir');
  console.log(`build-examples: ${name} -> ${path.relative(siteDir, path.join(outDir, 'examples', name))}`);
}
