import { type CSSProperties, type ReactNode, useEffect } from 'react';

const STYLE_ID = 'eskara-marquee-keyframes';

// @keyframes, a :hover on the viewport and a reduced-motion query have no inline form, so the sheet is injected once.
function ensureMarqueeStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `
@keyframes eskara-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.eskara-marquee-track { animation: eskara-marquee var(--eskara-marquee-duration) linear infinite; will-change: transform; }
.eskara-marquee-viewport:hover .eskara-marquee-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .eskara-marquee-track { animation: none; }
  .eskara-marquee-viewport { overflow-x: auto; }
}`;
  document.head.appendChild(el);
}

// The track holds the list twice and moves by exactly -50%, so the second copy sits where the first began.
// The gap is each tile's marginRight, not a flex gap: a container gap counts one fewer gap than the track needs and the seam stutters.
export function Marquee({
  items,
  durationSeconds,
  gap = 12,
  ariaLabel,
}: {
  items: ReactNode[];
  durationSeconds: number;
  gap?: number;
  ariaLabel: string;
}) {
  useEffect(ensureMarqueeStyles, []);

  const copy = (key: string, hidden?: boolean) => (
    <div key={key} style={{ display: 'flex' }} aria-hidden={hidden}>
      {items.map((item, i) => (
        <div key={i} style={{ flexShrink: 0, marginRight: gap }}>
          {item}
        </div>
      ))}
    </div>
  );

  return (
    <div
      className="eskara-marquee-viewport"
      role="group"
      aria-label={ariaLabel}
      style={{
        overflow: 'hidden',
        maskImage: 'linear-gradient(90deg, transparent, #000 24px, #000 calc(100% - 24px), transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 24px, #000 calc(100% - 24px), transparent)',
      }}
    >
      <div
        className="eskara-marquee-track"
        style={{ display: 'flex', width: 'max-content', '--eskara-marquee-duration': `${durationSeconds}s` } as CSSProperties}
      >
        {copy('a')}
        {copy('b', true)}
      </div>
    </div>
  );
}
