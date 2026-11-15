/**
 * N1: inside the app, a page leaves its origin only through `link.open`.
 * Fails on each navigation or popup to another origin, during a load or after
 * a click, with no `link.open` post for that URL in the same visit.
 */
import type { Finding } from '../rules.ts';
import { MAX_CLICKS, type Visit } from '../session.ts';

const normal = (url: string) => {
  try {
    return new URL(url).href;
  } catch {
    return url;
  }
};

export function judgeN1(visits: readonly Visit[]): Finding[] {
  const findings: Finding[] = [];
  const reported = new Set<string>();
  for (const visit of visits) {
    const opened = new Set(
      visit.posted.filter((p) => p.method === 'link.open').map((p) => normal(String((p.params as { url?: unknown }).url))),
    );
    for (const { url, via, trigger } of visit.departures) {
      if (opened.has(normal(url)) || reported.has(url)) continue;
      reported.add(url);
      findings.push({
        rule: 'N1',
        level: 'error',
        message: `${trigger} ${via === 'popup' ? 'opened a popup on' : 'navigated to'} ${url} with no link.open for it. Inside the app, leave the page through openUrl() or handleLinkClick()`,
      });
    }
    if (visit.unclicked > 0) {
      findings.push({
        rule: 'N1',
        level: 'warn',
        message: `${visit.unclicked} controls in ${visit.path} were not clicked, because a visit stops after ${MAX_CLICKS}`,
      });
    }
  }
  return findings;
}
