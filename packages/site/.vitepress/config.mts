import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitepress';
import llmstxt from 'vitepress-plugin-llms';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const repoName = 'skkuverse-miniapp';
const { owner } = JSON.parse(readFileSync(path.join(repoRoot, 'repo-links.json'), 'utf8')) as { owner: string };
const origin = process.env.SITE_ORIGIN ?? `https://${owner}.github.io`;
const base = `/${repoName}/`;
const repoUrl = `https://github.com/${owner}/${repoName}`;

// WHY: the Markdown lives under docs/, outside this package, so `vue` must resolve from here. The lookup is the only
// place that names it, which is why knip.json ignores the dependency.
const vueDir = path.dirname(createRequire(import.meta.url).resolve('vue/package.json'));

// Closed world: a Markdown file a later change adds anywhere else is never published.
const srcExclude = [
  '!(docs|packages)/**/*.md',
  '!(README).md',
  'packages/*/!(README).md',
  'packages/*/*/**/*.md',
  'docs/_template.md',
  '**/node_modules/**',
];

const isPublishedPage = (rel: string) =>
  rel === 'README.md' ||
  /^packages\/[^/]+\/README\.md$/.test(rel) ||
  (/^docs\/.+\.md$/.test(rel) && rel !== 'docs/_template.md');

function pageTitle(file: string): string {
  const text = readFileSync(path.join(repoRoot, file), 'utf8');
  const front = /^---\n([\s\S]*?)\n---/.exec(text)?.[1].match(/^title:\s*(.+)$/m)?.[1];
  const heading = /^# (.+)$/m.exec(text)?.[1];
  return (front ?? heading ?? path.basename(file, '.md')).trim().replace(/^["']|["']$/g, '');
}

function sidebarGroup(text: string, dir: string, link: (name: string) => string) {
  const names = readdirSync(path.join(repoRoot, dir)).filter((n) => n.endsWith('.md') && isPublishedPage(`${dir}/${n}`) && n !== 'README.md');
  return { text, items: names.sort().map((n) => ({ text: pageTitle(`${dir}/${n}`), link: link(n) })) };
}

const packages = readdirSync(path.join(repoRoot, 'packages')).filter((n) => existsSync(path.join(repoRoot, 'packages', n, 'README.md'))).sort();

const sidebar = [
  { text: 'Start', items: [{ text: 'Overview', link: '/' }, { text: 'Docs index', link: '/docs/README' }] },
  sidebarGroup('How-to', 'docs/how-to', (n) => `/docs/how-to/${n.replace(/\.md$/, '')}`),
  sidebarGroup('Reference', 'docs/reference', (n) => `/docs/reference/${n.replace(/\.md$/, '')}`),
  sidebarGroup('Explanation', 'docs/explanation', (n) => `/docs/explanation/${n.replace(/\.md$/, '')}`),
  sidebarGroup('Decisions', 'docs/decisions', (n) => `/docs/decisions/${n.replace(/\.md$/, '')}`),
  { text: 'Packages', items: packages.map((p) => ({ text: p, link: `/packages/${p}/` })) },
];

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export default defineConfig({
  title: repoName,
  description: 'The shared code every skkuverse miniapp imports, and the tools that check, test and ship one.',
  lang: 'en-US',
  base,
  srcDir: repoRoot,
  srcExclude,
  rewrites: {
    'README.md': 'index.md',
    'packages/:pkg/README.md': 'packages/:pkg/index.md',
  },
  // WHY: with the repository root as srcDir, VitePress would load every config.ts under it, packages/cli/src/config.ts included.
  additionalConfig: {},
  themeConfig: {
    nav: [
      { text: 'Docs', link: '/docs/README' },
      { text: 'Protocol', link: '/docs/reference/protocol' },
      { text: 'Spec', link: '/docs/reference/miniapp-spec' },
      { text: 'llms.txt', link: `${base}llms.txt` },
    ],
    sidebar,
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: repoUrl }],
    outline: [2, 3],
  },
  markdown: {
    config(md) {
      // A link to a repository file that is not a page of this site would be a dead link. Send it to GitHub.
      md.core.ruler.after('inline', 'repo-file-links', (state) => {
        const relativePath = (state.env as { relativePath?: string }).relativePath;
        if (!relativePath) return;
        const from = path.posix.dirname(relativePath);
        for (const block of state.tokens) {
          for (const token of block.children ?? []) {
            if (token.type !== 'link_open') continue;
            const href = token.attrGet('href');
            if (!href || href.startsWith('#') || href.startsWith('/') || SCHEME.test(href)) continue;
            const [target, ...rest] = href.split(/(?=[#?])/);
            const rel = path.posix.normalize(path.posix.join(from, decodeURI(target)));
            if (rel.startsWith('..') || !existsSync(path.join(repoRoot, rel))) continue;
            const suffix = rest.join('');
            const pkg = /^packages\/([^/]+)(?:\/(?:README\.md)?)?$/.exec(rel);
            if (pkg) {
              token.attrSet('href', path.posix.relative(from, `packages/${pkg[1]}/index.md`) + suffix);
            } else if (!isPublishedPage(rel)) {
              const kind = statSync(path.join(repoRoot, rel)).isDirectory() ? 'tree' : 'blob';
              token.attrSet('href', `${repoUrl}/${kind}/main/${rel.replace(/\/$/, '')}${suffix}`);
            }
          }
        }
      });
    },
  },
  vite: {
    resolve: {
      alias: [
        { find: /^vue$/, replacement: vueDir },
        { find: /^vue\/(.*)$/, replacement: `${vueDir}/$1` },
      ],
    },
    plugins: [
      llmstxt({
        domain: origin,
        title: repoName,
        description: 'The shared code every skkuverse miniapp imports, and the tools that check, test and ship one.',
        sidebar: sidebar.map((group) => ({ ...group, items: group.items.filter((item) => item.link !== '/') })),
      }),
    ],
  },
});
