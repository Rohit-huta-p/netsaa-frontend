#!/usr/bin/env node
/**
 * Cloudflare Pages drops any directory named `node_modules` from the deployed
 * output. Expo's web export (`expo export --platform web`) emits bundled package
 * assets — @expo-google-fonts TTFs, @react-navigation icons, datepicker images,
 * expo-router assets — under `dist/assets/node_modules/...`. On Pages those files
 * 404, the SPA fallback returns index.html (200 text/html), and every custom font
 * silently falls back to a system font.
 *
 * Fix: after export, relocate `assets/node_modules` -> `assets/vendored` and
 * rewrite the references (only the entry JS bundle points at the old path).
 * Runs automatically as part of `npm run build`. Idempotent + a no-op if the
 * directory isn't present.
 */
import { existsSync, renameSync, rmSync, readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = process.argv[2] || 'dist';
const FROM_SEG = 'node_modules';
const TO_SEG = 'vendored';
const SRC = join(DIST, 'assets', FROM_SEG);
const DEST = join(DIST, 'assets', TO_SEG);
const FROM = `assets/${FROM_SEG}`;
const TO = `assets/${TO_SEG}`;

if (!existsSync(SRC)) {
  console.log(`[cf-fix] ${SRC} not present — nothing to relocate (ok).`);
  process.exit(0);
}
if (existsSync(DEST)) rmSync(DEST, { recursive: true, force: true });
renameSync(SRC, DEST);
console.log(`[cf-fix] moved ${SRC} -> ${DEST}`);

const exts = ['.js', '.css', '.html', '.json', '.map'];
let patched = 0;
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) { walk(p); continue; }
    if (!exts.some((e) => name.endsWith(e))) continue;
    const txt = readFileSync(p, 'utf8');
    if (!txt.includes(FROM)) continue;
    writeFileSync(p, txt.split(FROM).join(TO));
    patched++;
    console.log(`[cf-fix] patched ${p.replace(DIST + '/', '')}`);
  }
};
walk(DIST);
console.log(`[cf-fix] done — relocated assets + patched ${patched} file(s).`);
