import { useEffect, useState } from 'react';
import { haptic, isInApp, ready, share } from '@skkuverse/miniapp';
import type { FakeHost } from '@skkuverse/miniapp/testing';
import { Button, ListRow, SegmentedControl } from '@skkuverse/ui';
import { DAYS, SLOTS, type Day, type Slot } from './timetable';

export default function App({ host }: { host: FakeHost | null }) {
  const [day, setDay] = useState<Day>('day1');
  const [starred, setStarred] = useState<ReadonlySet<string>>(new Set());
  const [note, setNote] = useState('');

  useEffect(() => ready(), []);

  const toggle = (slot: Slot) => {
    haptic('light');
    setStarred((prev) => {
      const next = new Set(prev);
      if (!next.delete(slot.id)) next.add(slot.id);
      return next;
    });
  };

  const shareSlot = async (slot: Slot) => {
    const result = await share({ url: `https://example.com/timetable#${slot.id}`, text: `${slot.act}, ${slot.start}` });
    setNote(`share() returned "${result}"`);
  };

  return (
    <main style={{ padding: 'calc(var(--sv-inset-top, 0px) + 16px) 0 calc(var(--sv-inset-bottom, 0px) + 16px)', maxWidth: 480, margin: '0 auto' }}>
      <header style={{ padding: '0 20px 12px' }}>
        <h1 style={{ fontSize: 22, margin: '0 0 4px' }}>Stage timetable</h1>
        <p style={{ margin: 0, color: '#6B7684', fontSize: 14 }}>
          An example miniapp on <code>@skkuverse/miniapp</code>. The acts are made up.
        </p>
      </header>
      <div style={{ padding: '0 20px 8px' }}>
        <SegmentedControl value={day} onChange={(value) => setDay(value as Day)}>
          {DAYS.map((d) => (
            <SegmentedControl.Item key={d.value} value={d.value}>
              {d.label}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl>
      </div>
      {SLOTS.filter((slot) => slot.day === day).map((slot) => (
        <ListRow
          key={slot.id}
          style={{ paddingLeft: 20, paddingRight: 20 }}
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top={`${starred.has(slot.id) ? '★ ' : ''}${slot.act}`}
              bottom={`${slot.start} to ${slot.end}, ${slot.stage}`}
            />
          }
          right={
            <div style={{ display: 'flex', gap: 6 }}>
              <Button size="small" variant="weak" aria-pressed={starred.has(slot.id)} onClick={() => toggle(slot)}>
                {starred.has(slot.id) ? 'Starred' : 'Star'}
              </Button>
              <Button size="small" variant="weak" color="dark" onClick={() => void shareSlot(slot)}>
                Share
              </Button>
            </div>
          }
        />
      ))}
      <BridgeLog host={host} note={note} />
    </main>
  );
}

function BridgeLog({ host, note }: { host: FakeHost | null; note: string }) {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (!host) return;
    const read = () => setLines(host.messages.map((m) => (m ? `${m.method} ${JSON.stringify(m.params)}` : '(unparsed message)')));
    read();
    return host.onMessage(read);
  }, [host]);

  return (
    <section aria-label="Bridge log" style={{ margin: '24px 20px 0', padding: 12, borderRadius: 12, background: '#F2F4F6', fontSize: 13 }}>
      <strong>{host ? 'Messages the page sent to the fake host' : 'No host: a plain browser'}</strong>
      <p style={{ margin: '4px 0 8px', color: '#6B7684' }}>
        isInApp() is {String(isInApp())}.{' '}
        {host ? (
          <a href="?host=none">Open as a plain browser</a>
        ) : (
          <>
            haptic() does nothing and share() falls back to the browser. <a href="?">Open with the fake host</a>
          </>
        )}
      </p>
      {note ? <p style={{ margin: '0 0 8px' }}>{note}</p> : null}
      {host ? (
        <ol style={{ margin: 0, paddingLeft: 20, fontFamily: 'ui-monospace, monospace', overflowWrap: 'anywhere' }}>
          {lines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
