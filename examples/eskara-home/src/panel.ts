import type { PanelEntry, SheetSpec } from '../../shared/host-panel';
import { ROWS } from './festival';

/** What the app would draw for a `link.open` or `map.openPlace` the page sent: the row's page name, and what the page asked for. */
export function sheetFor(entry: PanelEntry): SheetSpec | null {
  const params = entry.params as { url?: string; place?: string } | undefined;
  const row = ROWS.find((r) => (r.action.kind === 'page' ? r.action.url === params?.url : r.action.place === params?.place));
  if (!row) return null;
  return { title: row.title, detail: params?.url ?? params?.place, dismiss: 'Close' };
}
