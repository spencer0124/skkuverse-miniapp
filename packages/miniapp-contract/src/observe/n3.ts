import type { Finding } from '../rules.ts';
import { MAX_ROUTES, type Session } from '../session.ts';

const under = (route: string, path: string) => route === path || route.startsWith(path.endsWith('/') ? path : `${path}/`);

export async function judgeN3(session: Session, routes: readonly string[], operatorPaths: readonly string[]): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const route of routes.slice(0, MAX_ROUTES)) {
    if (operatorPaths.some((path) => under(route, path))) continue;
    const visit = await session.visit(route, { host: false, click: false });
    if (visit.rootMarked) continue;
    findings.push({
      rule: 'N3',
      level: 'error',
      message: `${route} renders outside <MiniappRoot>: loaded in a browser, nothing set data-sv-chrome on <html>. Render it inside <MiniappRoot>, or list it in operatorPaths if it is an operator page`,
    });
  }
  if (routes.length > MAX_ROUTES) {
    findings.push({ rule: 'N3', level: 'warn', message: `${routes.length - MAX_ROUTES} routes were not loaded, because the runner stops after ${MAX_ROUTES}` });
  }
  return findings;
}
