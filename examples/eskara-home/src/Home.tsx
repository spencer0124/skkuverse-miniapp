import { useEffect } from 'react';
import { canOpenMap, haptic, isInApp, openMapPlace, openUrl, ready } from '@skkuverse/miniapp';
import { ListRow, Paragraph, useAdaptive } from '@skkuverse/ui';
import { ARCHIVE_NOTICE, FESTIVAL, LINEUP, ROWS, type Row } from './festival';
import { Marquee } from './marquee';
import { ArchiveNotice, Card, Page } from './page';

/** A tap is a haptic tick, then the row's action. A plain browser has no app to hand an in-app address to, so it stops after the tick. */
export function tapRow(row: Row): void {
  haptic('light');
  if (!isInApp()) return;
  if (row.action.kind === 'map') openMapPlace(row.action.place);
  else openUrl(row.action.url);
}

export default function Home() {
  useEffect(() => ready(), []);
  // The map row, like the real page's map button, renders only where the app grants a map.
  const rows = ROWS.filter((row) => row.action.kind !== 'map' || canOpenMap());

  return (
    <Page>
      <ArchiveNotice notice={ARCHIVE_NOTICE} />

      <div style={{ paddingTop: 20 }}>
        <Marquee
          items={LINEUP.map((act) => (
            <ActTile key={act.name} name={act.name} day={act.day} />
          ))}
          durationSeconds={LINEUP.length * 3.2}
          ariaLabel={`${FESTIVAL.year} ${FESTIVAL.name} 아티스트 라인업`} // conventions:allow-korean
        />
      </div>

      <div style={{ padding: '28px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((row) => (
            <button
              key={row.title}
              type="button"
              onClick={() => tapRow(row)}
              style={{ display: 'block', width: '100%', padding: 0, border: 0, background: 'none', color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}
            >
              <Card style={{ padding: '4px 16px' }}>
                <ListRow
                  left={<ListRow.AssetIcon>{row.icon}</ListRow.AssetIcon>}
                  contents={<RowText title={row.title} description={row.description} />}
                  right={<Chevron />}
                />
              </Card>
            </button>
          ))}
        </div>
      </div>
    </Page>
  );
}

// Names run from "YB" to "ALLDAY PROJECT". A fixed width keeps the strip from pulsing as tiles of different widths pass.
function ActTile({ name, day }: { name: string; day: string }) {
  const adaptive = useAdaptive();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: 4,
        width: 184,
        aspectRatio: '3 / 4',
        boxSizing: 'border-box',
        padding: 16,
        borderRadius: 16,
        background: adaptive.grey200,
      }}
    >
      <Paragraph typography="t7" color={adaptive.grey600}>
        {day}
      </Paragraph>
      <Paragraph typography="t4" fontWeight="bold">
        {name}
      </Paragraph>
    </div>
  );
}

// ListRow.Texts sets nowrap on each line, so a sentence runs off the card. Two wrapping lines read better.
function RowText({ title, description }: { title: string; description: string }) {
  const adaptive = useAdaptive();
  return (
    <div style={{ minWidth: 0, paddingRight: 4 }}>
      <Paragraph typography="t5" fontWeight="bold">
        {title}
      </Paragraph>
      <div style={{ marginTop: 2 }}>
        <Paragraph typography="t7" color={adaptive.grey600} numberOfLines={2}>
          {description}
        </Paragraph>
      </div>
    </div>
  );
}

function Chevron() {
  const adaptive = useAdaptive();
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden>
      <path d="M1 1l6 6-6 6" stroke={adaptive.grey400} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
