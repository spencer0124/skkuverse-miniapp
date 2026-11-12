import type { Finding } from './check.ts';

/** Prints one miniapp's findings. True when nothing is an error. */
export function report(id: string, findings: Finding[]): boolean {
  const errors = findings.filter((f) => f.level === 'error');
  for (const f of findings) {
    console.log(`${f.level === 'error' ? '✗' : '!'} ${id} ${f.rule} ${f.message}`);
  }
  if (errors.length === 0) console.log(`✓ ${id}`);
  return errors.length === 0;
}
