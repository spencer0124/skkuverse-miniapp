import type { CSSProperties, ReactNode } from 'react';
import { Paragraph, useAdaptive } from '@skkuverse/ui';

export function Page({ children }: { children: ReactNode }) {
  const adaptive = useAdaptive();
  return (
    <div
      style={{
        background: adaptive.background,
        color: adaptive.grey900,
        minHeight: '100%',
        WebkitFontSmoothing: 'antialiased',
        // Korean wraps between words, not mid-word. break-word keeps a long unbroken token from overflowing.
        wordBreak: 'keep-all',
        overflowWrap: 'break-word',
        paddingBottom: 'var(--sv-inset-bottom, env(safe-area-inset-bottom, 0px))',
      }}
    >
      {children}
    </div>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const adaptive = useAdaptive();
  return <div style={{ background: adaptive.grey100, borderRadius: 16, padding: '16px 18px', ...style }}>{children}</div>;
}

export function ArchiveNotice({ notice }: { notice: string | null }) {
  const adaptive = useAdaptive();
  if (!notice) return null;
  return (
    <div
      role="note"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '16px 20px 0',
        padding: '12px 14px',
        background: adaptive.grey100,
        borderRadius: 12,
      }}
    >
      <span aria-hidden>{'\u{1F5C2}\u{FE0F}'}</span>
      <Paragraph typography="t7" color={adaptive.grey600}>
        {notice}
      </Paragraph>
    </div>
  );
}
