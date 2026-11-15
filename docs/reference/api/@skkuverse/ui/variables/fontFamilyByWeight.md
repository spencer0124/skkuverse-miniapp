---
title: "@skkuverse/ui fontFamilyByWeight (variable)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Variable: fontFamilyByWeight

> `const` **fontFamilyByWeight**: `Record`\<[`FontWeightKeys`](../type-aliases/FontWeightKeys.md), `string`\>

Platform-specific font family map for font weights.
On iOS, RN uses fontWeight directly. On Android, we may need specific font files.
