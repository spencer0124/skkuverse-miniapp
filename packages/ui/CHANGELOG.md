# @skkuverse/ui

## 0.1.1

### Patch Changes

- 61ba9f0: `BottomCTA`, `BottomSheet` and `Toast` keep clear of the app's UI and the home indicator through `--sv-inset-*`, the variables the skkuverse app injects, and fall back to `env(safe-area-inset-*)` outside it. `env()` alone reads zero on recent Android WebViews and ignores the app's bottom bar.
