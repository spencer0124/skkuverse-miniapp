---
"@skkuverse/miniapp": patch
---

`hostBootstrapScript` and `hostDeliverScript` escape `<`, `>` and `/` in the values they embed, so neither script can be closed early when it sits in an HTML `<script>` element. What the scripts do is unchanged.
