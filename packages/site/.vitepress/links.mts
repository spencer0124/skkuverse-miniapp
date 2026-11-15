import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parse, postprocess, preprocess } from 'micromark';
import { gfmTable } from 'micromark-extension-gfm-table';
import { decodeString } from 'micromark-util-decode-string';
import { normalizeIdentifier } from 'micromark-util-normalize-identifier';

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

const isRelative = (href: string) => href !== '' && !href.startsWith('#') && !href.startsWith('/') && !SCHEME.test(href);

export const isPublishedPage = (rel: string) =>
  rel === 'README.md' ||
  /^packages\/[^/]+\/README\.md$/.test(rel) ||
  (/^docs\/.+\.md$/.test(rel) && rel !== 'docs/_template.md');

// Closed world: VitePress publishes every Markdown file these globs do not exclude, and they leave exactly the files
// isPublishedPage names. A Markdown file a later change adds anywhere else is never published.
export const srcExclude = [
  '!(docs|packages)/**/*.md',
  '!(README).md',
  'packages/*.md',
  'packages/*/!(README).md',
  'packages/*/*/**/*.md',
  'docs/_template.md',
  '**/node_modules/**',
];

export interface RepoLink {
  rel: string;
  suffix: string;
  isDir: boolean;
  pkg: string | undefined;
}

/** The repository file a relative link points at, or undefined when it is not a relative link to an existing file. */
export function repoLinkOf(repoRoot: string, fromRel: string, href: string): RepoLink | undefined {
  if (!isRelative(href)) return undefined;
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
  `${repoUrl}/${link.isDir ? 'tree' : 'blob'}/main/${encodeURI(link.rel.replace(/\/$/, ''))}${link.suffix}`;

interface Destination {
  start: number;
  end: number;
  href: string;
}

const DESTINATIONS = new Set(['resourceDestinationString', 'definitionDestinationString']);

// WHY: micromark records the source offset of every token, so a destination is cut out of the text exactly as written,
// with no search for it. Container prefixes, escapes, entities and table cells are the parser's business.
function destinations(text: string): Destination[] {
  const events = postprocess(parse({ extensions: [gfmTable()] }).document().write(preprocess()(text, undefined, true)));
  const labels = new Set<string>();
  const found: Destination[] = [];
  let repeat = false;
  for (const [kind, token] of events) {
    if (kind !== 'enter') continue;
    const raw = text.slice(token.start.offset, token.end.offset);
    if (token.type === 'definitionLabelString') {
      // CommonMark keeps the first definition of a label, so a repeat links nothing and is left as written.
      const label = normalizeIdentifier(raw);
      repeat = labels.has(label);
      labels.add(label);
    } else if (DESTINATIONS.has(token.type) && !(token.type === 'definitionDestinationString' && repeat)) {
      found.push({ start: token.start.offset, end: token.end.offset, href: decodeString(raw) });
    }
  }
  return found;
}

// A rewritten target is written where the authored one stood, so it percent-encodes what would end a destination.
const asDestination = (href: string) =>
  href.replace(/[\x00-\x20()<>\\\x7f]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`);

/** Rewrites each link target that is not code. `rewrite` gets the target as CommonMark reads it, and returns a new one or undefined. */
export function mapLinks(text: string, rewrite: (href: string) => string | undefined): string {
  const edits = destinations(text).flatMap(({ start, end, href }) => {
    const to = rewrite(href);
    return to !== undefined && to !== href ? [{ start, end, to: asDestination(to) }] : [];
  });
  return edits.sort((a, b) => b.start - a.start).reduce((acc, e) => acc.slice(0, e.start) + e.to + acc.slice(e.end), text);
}

// A checkout with core.autocrlf writes CRLF; the copies are built from that text, and every pattern here reads LF.
const readLf = (file: string) => readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

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
    if (!link) {
      if (isRelative(href)) throw new Error(`${source}: cannot rewrite the link ${href}, which names no file in this repository`);
      return undefined;
    }
    let published: string | undefined;
    if (link.pkg) published = `packages/${link.pkg}.md`;
    else if (link.rel !== 'README.md' && isPublishedPage(link.rel)) published = link.rel;
    if (!published) return githubUrl(repoUrl, link);
    const to = copyPath ? path.posix.relative(path.posix.dirname(copyPath), published) : `${siteUrl}${published}`;
    return to + link.suffix;
  };

  for (const copy of markdownCopies(outDir)) {
    const file = path.join(outDir, copy);
    writeFileSync(file, mapLinks(readLf(file), target(sourceOfCopy(copy), copy)));
  }

  const full = path.join(outDir, 'llms-full.txt');
  if (!existsSync(full)) return;
  const header = /^---\nurl: (?:>-\n\s+)?(\S+)\n---\n/gm;
  const text = readLf(full);
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
