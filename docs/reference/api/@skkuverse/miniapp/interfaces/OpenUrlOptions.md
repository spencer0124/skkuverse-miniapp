---
title: "@skkuverse/miniapp OpenUrlOptions (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: OpenUrlOptions

## Properties

### appUrl?

> `optional` **appUrl?**: `string`

An app's own scheme (`spotify:track:…`, `youtube://…`) the app tries first,
falling back to `url` when nothing on the device handles it. Leave it off
for a site whose https links its app already claims, such as Instagram: an
app that takes the scheme but ignores its path never reaches `url`.
