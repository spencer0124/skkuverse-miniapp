/**
 * The files the platform writes into every deploy, after the check passes.
 *
 * A miniapp never ships these itself (spec rule O2): the CSP is the point of
 * hosting a miniapp, so the miniapp must not be able to weaken it.
 *
 * Only `script-src` is restricted. Every miniapp loads the Tossface stylesheet
 * from a CDN and `@skkuverse/ui` injects an inline `<style>`, so a `style-src`
 * would break them while adding little: the risk worth closing is code that
 * changes after review, which means scripts.
 *
 * `_headers` rules are additive and a header applied twice is comma-joined, so
 * each header appears under exactly one path pattern.
 */

export const CONTENT_SECURITY_POLICY = "script-src 'self'; object-src 'none'; base-uri 'self'";

export const HEADERS_FILE = `/*
  Content-Security-Policy: ${CONTENT_SECURITY_POLICY}

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;

// Pages already falls back to index.html when a project ships no 404.html.
// Pinning it here keeps the fallback if that default ever changes.
export const REDIRECTS_FILE = `/*    /index.html   200
`;
