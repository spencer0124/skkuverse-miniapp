import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import reference from 'markdown-it/lib/rules_block/reference.mjs';
import image from 'markdown-it/lib/rules_inline/image.mjs';
import link from 'markdown-it/lib/rules_inline/link.mjs';

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

interface Span {
  start: number;
  end: number;
}

// A parser, not line patterns, decides what is a link: fences of any nesting, code spans, titles and reference
// definitions are CommonMark's business. The parser records where each destination sits in the source, and
// nothing else is edited.
const inlineSpans = new WeakMap<object, Span[]>();
const parser = new MarkdownIt({ html: true });

for (const [name, rule, isImage] of [['link', link, false], ['image', image, true]] as const) {
  parser.inline.ruler.at(name, (state: any, silent: boolean) => {
    const before = state.tokens.length;
    const start: number = state.pos;
    if (!rule(state, silent)) return false;
    if (silent) return true;
    const token = isImage ? state.tokens[state.tokens.length - 1] : state.tokens.slice(before).find((t: any) => t.type === 'link_open');
    const href: string | null = token.attrGet(isImage ? 'src' : 'href');
    const labelEnd: number = parser.helpers.parseLinkLabel(state, isImage ? start + 1 : start, !isImage);
    if (state.src[labelEnd + 1] !== '(') return true;
    let pos = labelEnd + 2;
    while (pos < state.posMax && /\s/.test(state.src[pos])) pos++;
    const dest = parser.helpers.parseLinkDestination(state.src, pos, state.posMax);
    if (!dest.ok || parser.normalizeLink(dest.str) !== href) return true;
    const angle = state.src[pos] === '<' ? 1 : 0;
    const list = inlineSpans.get(state.tokens) ?? [];
    list.push({ start: pos + angle, end: dest.pos - angle });
    inlineSpans.set(state.tokens, list);
    return true;
  });
}

parser.block.ruler.at('reference', (state: any, startLine: number, endLine: number, silent: boolean) => {
  if (!reference(state, startLine, endLine, silent)) return false;
  if (silent) return true;
  const from: number = state.bMarks[startLine] + state.tShift[startLine];
  const to: number = state.eMarks[state.line - 1];
  const raw: string = state.src.slice(from, to);
  let colon = 1;
  while (colon < raw.length && raw[colon] !== ']') colon += raw[colon] === '\\' ? 2 : 1;
  let pos = from + colon + 2;
  while (pos < to && /\s/.test(state.src[pos])) pos++;
  const dest = parser.helpers.parseLinkDestination(state.src, pos, to);
  const href = dest.ok && parser.normalizeLink(dest.str);
  if (!href || !Object.values<{ href: string }>(state.env.references).some((r) => r.href === href)) {
    throw new Error(`cannot locate the destination of the reference definition at line ${startLine + 1}`);
  }
  const angle = state.src[pos] === '<' ? 1 : 0;
  state.env.definitionSpans.push({ start: pos + angle, end: dest.pos - angle });
  return true;
});

/** The source position of every link, image and reference-definition destination that is not code. */
function linkTargets(text: string): Span[] {
  if (text.includes('\r')) throw new Error('a Markdown copy with a carriage return is not supported');
  const env: { definitionSpans: Span[] } = { definitionSpans: [] };
  const tokens = parser.parse(text, env);
  const lineStart: number[] = [0];
  for (let i = text.indexOf('\n'); i >= 0; i = text.indexOf('\n', i + 1)) lineStart.push(i + 1);
  const lineAt = (n: number) => text.slice(lineStart[n], (lineStart[n + 1] ?? text.length + 1) - 1);
  const found = [...env.definitionSpans];
  let block: number[] = [0, 0];
  const cursor = new Map<number, number>();
  for (const token of tokens) {
    if (token.map) block = token.map;
    const spans = token.type === 'inline' ? inlineSpans.get(token.children) : undefined;
    if (!spans) continue;
    // WHY: a table cell has no source map of its own, so it takes the row's. The content of an inline token is its
    // source lines minus the container prefix, so each line is found again inside its source line.
    const row = block[0];
    const bases: { content: number; file: number }[] = [];
    let content = 0;
    token.content.split('\n').forEach((piece: string, i: number) => {
      const at = lineAt(row + i).indexOf(piece, cursor.get(row + i) ?? 0);
      if (at < 0) throw new Error(`cannot align inline content with line ${row + i + 1}`);
      cursor.set(row + i, at + piece.length);
      bases.push({ content, file: lineStart[row + i] + at });
      content += piece.length + 1;
    });
    for (const span of spans) {
      const base = [...bases].reverse().find((b) => b.content <= span.start)!;
      const delta = base.file - base.content;
      found.push({ start: span.start + delta, end: span.end + delta });
    }
  }
  return found;
}

/** Rewrites each link target that is not code. `rewrite` returns a new target, or undefined to keep it. */
export function mapLinks(text: string, rewrite: (href: string) => string | undefined): string {
  const edits = linkTargets(text).flatMap(({ start, end }) => {
    const href = text.slice(start, end);
    const to = rewrite(href);
    return to !== undefined && to !== href ? [{ start, end, to }] : [];
  });
  return edits.sort((a, b) => b.start - a.start).reduce((acc, e) => acc.slice(0, e.start) + e.to + acc.slice(e.end), text);
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
