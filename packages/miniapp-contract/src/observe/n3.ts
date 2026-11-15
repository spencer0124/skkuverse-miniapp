import type { Finding } from '../rules.ts';
import { MAX_ROUTES, type Session } from '../session.ts';

/** `deploy.config.json` holds each path to `/` and at least one segment, so the base is never empty. */
const under = (route: string, path: string) => {
  const base = path.replace(/\/+$/, '');
  return route === base || route.startsWith(`${base}/`);
};

export async function judgeN3(session: Session, routes: readonly string[], operatorPaths: readonly string[]): Promise<Finding[]> {
  const findings: Finding[] = operatorPaths.map((path) => {
    const skipped = routes.filter((route) => under(route, path));
    return {
      rule: 'N3',
      level: 'warn',
      message: `did not load ${path} or any route under it, because operatorPaths in deploy.config.json lists it. ${
        skipped.length > 0 ? `The crawl reached ${skipped.join(', ')}` : 'The crawl reached no route under it'
      }`,
    };
  });
  for (const route of routes.slice(0, MAX_ROUTES)) {
    if (operatorPaths.some((path) => under(route, path))) continue;
    const visit = await session.visit(route, { host: false, click: false });
    if (visit.rootMarked) continue;
    findings.push({
      rule: 'N3',
      level: 'error',
      message: `${route} renders outside <MiniappRoot>: loaded in a browser, nothing set data-sv-chrome on <html>. Render it inside <MiniappRoot>, or list it in operatorPaths if it is an operator page; the runner prints every path it skips`,
    });
  }
  if (routes.length > MAX_ROUTES) {
    findings.push({ rule: 'N3', level: 'warn', message: `${routes.length - MAX_ROUTES} routes were not loaded, because the runner stops after ${MAX_ROUTES}` });
  }
  return findings;
}
