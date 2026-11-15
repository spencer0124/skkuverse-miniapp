import { haptic } from '@skkuverse/miniapp';

export default function App() {
  return (
    <main style={{ padding: 'calc(var(--sv-inset-top, 0px) + 16px) 16px calc(var(--sv-inset-bottom, 0px) + 16px)' }}>
      <h1>__ID__</h1>
      <button type="button" onClick={() => haptic('light')}>
        Haptic
      </button>
    </main>
  );
}
