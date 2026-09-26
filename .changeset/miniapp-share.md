---
"@skkuverse/miniapp": minor
---

Add `share.open` and `share({ url, text })`. In the app it opens the native share sheet. In a browser it uses Web Share, then falls back to copying the link, and resolves `'shared'`, `'copied'`, `'cancelled'` or `'failed'` so the page can say what happened.
