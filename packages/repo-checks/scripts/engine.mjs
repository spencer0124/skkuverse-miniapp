/**
 * Fills the generated parts of a Markdown file. A part sits between two comments, which GitHub and the docs site hide:
 *
 *     <!-- docs-gen:begin method-table kind=miniapp -->
 *     ...replaced on every run...
 *     <!-- docs-gen:end method-table -->
 *
 * A part whose begin comment ends its line holds a block, which the engine sets off with blank lines. A part with text
 * between the two comments on one line is inline, and the text replaces it as it is.
 */
const PART = /<!-- docs-gen:begin ([a-z-]+)((?: [a-z-]+=\S+)*) -->([\s\S]*?)<!-- docs-gen:end \1 -->/g;

function parseArgs(text) {
  return Object.fromEntries(
    text
      .trim()
      .split(/\s+/)
      .filter((pair) => pair !== '')
      .map((pair) => pair.split('=')),
  );
}

/** The file's text with every part regenerated, and the names of the parts it held. */
export function fill(text, file, transforms) {
  const parts = [];
  const filled = text.replace(PART, (whole, name, args, inner) => {
    const transform = transforms[name];
    if (transform === undefined) throw new Error(`${file}: no docs-gen transform named "${name}"`);
    parts.push(name);
    const output = transform(parseArgs(args), { file });
    if (typeof output !== 'string') throw new Error(`${file}: docs-gen transform "${name}" returned no text`);
    const block = inner.startsWith('\n');
    const body = block ? `\n\n${output}\n\n` : output;
    return `<!-- docs-gen:begin ${name}${args} -->${body}<!-- docs-gen:end ${name} -->`;
  });
  return { text: filled, parts };
}

/** The parts a file holds, without running any. */
export function partsOf(text) {
  return [...text.matchAll(PART)].map((match) => match[1]);
}

/** A begin comment with no end, or an end with no begin, would leave a part unmanaged without a word. */
export function unbalanced(text) {
  const begins = (text.match(/<!-- docs-gen:begin /g) ?? []).length;
  const ends = (text.match(/<!-- docs-gen:end /g) ?? []).length;
  return begins !== ends || begins !== partsOf(text).length;
}
