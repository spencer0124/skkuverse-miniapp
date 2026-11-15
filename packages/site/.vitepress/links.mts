import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export const isPublishedPage = (rel: string) =>
  rel === 'README.md' ||
  /^packages\/[^/]+\/README\.md$/.test(rel) ||
  (/^docs\/.+\.md$/.test(rel) && rel !== 'docs/_template.md');

export interface RepoLink {
  rel: string;
  suffix: string;
  isDir: boolean;
  pkg: string | undefined;
}

/** The repository file a relative link points at, or undefined when it is not a relative link to an existing file. */
export function repoLinkOf(repoRoot: string, fromRel: string, href: string): RepoLink | undefined {
  if (!href || href.startsWith('#') || href.startsWith('/') || SCHEME.test(href)) return undefined;
  const [target, ...rest] = href.split(/(?=[#?])/);
  const rel = path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), decodeURI(target)));
  if (rel.startsWith('..') || !existsSync(path.join(repoRoot, rel))) return undefined;
  return {
    rel,
    suffix: rest.join(''),
    isDir: statSync(path.join(repoRoot, rel)).isDirectory(),
    pkg: /^packages\/([^/]+)(?:\/(?:README\.md)?)?$/.exec(rel)?.[1],
  };
}

export const githubUrl = (repoUrl: string, link: RepoLink) =>
  `${repoUrl}/${link.isDir ? 'tree' : 'blob'}/main/${link.rel.replace(/\/$/, '')}${link.suffix}`;

/** Rewrites each link target outside code fences and inline code. `rewrite` returns a new target, or undefined to keep it. */
export function mapLinks(text: string, rewrite: (href: string) => string | undefined): string {
  let fenced = false;
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
      if (fenced) return line;
      const masked = line.replace(/`[^`]*`/g, (code) => '\0'.repeat(code.length));
      const edits: { start: number; end: number; to: string }[] = [];
      const consider = (start: number, href: string) => {
        const to = rewrite(href);
        if (to !== undefined && to !== href) edits.push({ start, end: start + href.length, to });
      };
      for (const m of masked.matchAll(/\]\(<?([^)\s>]+)/g)) consider(m.index + m[0].length - m[1].length, m[1]);
      const def = /^(\s{0,3}\[[^\]]+\]:\s*<?)(\S+?)>?\s*$/.exec(masked);
      if (def) consider(def[1].length, def[2]);
      return edits.sort((a, b) => b.start - a.start).reduce((acc, e) => acc.slice(0, e.start) + e.to + acc.slice(e.end), line);
    })
    .join('\n');
}

function markdownCopies(outDir: string): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'assets') walk(full);
      } else if (entry.name.endsWith('.md')) {
        found.push(path.relative(outDir, full).split(path.sep).join('/'));
      }
    }
  };
  walk(outDir);
  return found;
}

const sourceOfCopy = (copy: string) => {
  const pkg = /^packages\/([^/]+)\.md$/.exec(copy);
  return pkg ? `packages/${pkg[1]}/README.md` : copy;
};

export interface LinkContext {
  repoRoot: string;
  repoUrl: string;
  siteUrl: string;
  outDir: string;
}

/**
 * The Markdown copies and llms-full.txt come from the source text, so their relative links still point at the
 * repository layout. A link to a published page goes to that page's `.md` copy (relative in a copy, absolute in the
 * single file llms-full.txt), and a link to any other repository file goes to GitHub.
 */
export function rewriteMarkdownOutputs({ repoRoot, repoUrl, siteUrl, outDir }: LinkContext): void {
  const target = (source: string, copyPath: string | undefined) => (href: string) => {
    const link = repoLinkOf(repoRoot, source, href);
    if (!link) return undefined;
    let published: string | undefined;
    if (link.pkg) published = `packages/${link.pkg}.md`;
    else if (link.rel !== 'README.md' && isPublishedPage(link.rel)) published = link.rel;
    if (!published) return githubUrl(repoUrl, link);
    const to = copyPath ? path.posix.relative(path.posix.dirname(copyPath), published) : `${siteUrl}${published}`;
    return to + link.suffix;
  };

  for (const copy of markdownCopies(outDir)) {
    const file = path.join(outDir, copy);
    writeFileSync(file, mapLinks(readFileSync(file, 'utf8'), target(sourceOfCopy(copy), copy)));
  }

  const full = path.join(outDir, 'llms-full.txt');
  if (!existsSync(full)) return;
  const header = /^---\nurl: (?:>-\n\s+)?(\S+)\n---\n/gm;
  const text = readFileSync(full, 'utf8');
  const marks = [...text.matchAll(header)];
  let out = text.slice(0, marks[0]?.index ?? text.length);
  marks.forEach((mark, i) => {
    const end = marks[i + 1]?.index ?? text.length;
    const copy = mark[1].startsWith(siteUrl) ? mark[1].slice(siteUrl.length) : undefined;
    const body = text.slice(mark.index + mark[0].length, end);
    out += mark[0] + (copy ? mapLinks(body, target(sourceOfCopy(copy), undefined)) : body);
  });
  writeFileSync(full, out);
}
