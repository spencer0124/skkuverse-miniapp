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
 *
 * A game gets its own headers (spec G4). It loads nothing from anywhere else,
 * so everything is closed to its own origin, with inline data allowed for
 * images and media. `connect-src 'self'` is what lets a game fetch its own
 * hashed sound files. `default-src` also covers styles and fonts, so a game
 * keeps those in files too: no inline `<style>`, no `style=` attribute, and no
 * font inlined as data. `frame-src 'none'` closes frames outright rather than
 * leaving them to `default-src`: a game embeds no other page. `check` holds
 * the built output to all of this (spec G5).
 */
import type { Kind } from './config.ts';

export const CONTENT_SECURITY_POLICY = "script-src 'self'; object-src 'none'; base-uri 'self'";

export const HEADERS_FILE = `/*
  Content-Security-Policy: ${CONTENT_SECURITY_POLICY}

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;

export const GAME_CONTENT_SECURITY_POLICY =
  "default-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; media-src 'self' data:; frame-src 'none'; object-src 'none'; base-uri 'self'";

export const GAME_HEADERS_FILE = `/*
  Content-Security-Policy: ${GAME_CONTENT_SECURITY_POLICY}

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;

// Pages already falls back to index.html when a project ships no 404.html.
// Pinning it here keeps the fallback if that default ever changes. A game is
// one page, so the same fallback serves it.
export const REDIRECTS_FILE = `/*    /index.html   200
`;

/** The files `ship` writes into a deploy of each kind, by name. */
export function platformFiles(kind: Kind): Readonly<Record<'_headers' | '_redirects', string>> {
  return {
    _headers: kind === 'app' ? HEADERS_FILE : GAME_HEADERS_FILE,
    _redirects: REDIRECTS_FILE,
  };
}
