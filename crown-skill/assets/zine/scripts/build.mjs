#!/usr/bin/env node
/**
 * build.mjs — crown build → strip the decoy page → snapshot → impose
 *
 *   dist/book.pdf (raw Prince output, decoy attached)
 *     → book/<TITLE>.<YYYY-MM-DD-HHMMSS>/
 *         book.pdf     ordered trim-size pages — the file to proof
 *         sheets.pdf   imposed on letter sheets — the file to print (if FORMAT)
 *         book.html, styles.css, fonts/   kept beside the PDF for the record
 *
 * The decoy first page (src/content/000-decoy.md) exists to absorb the
 * PrinceXML non-commercial logo; it is removed here with pdf-lib. Every
 * build lands in its own timestamped folder and nothing is overwritten —
 * the convention shared by weave-watch-wait, drawing-instructions and
 * wobble-of-the-pen.
 *
 *   node scripts/build.mjs              full build
 *   node scripts/build.mjs --no-layout  skip imposition this once
 */

import { execSync } from 'node:child_process';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { PDFDocument } from 'pdf-lib';

// ---- Edit these for the book ---------------------------------------------
const TITLE = 'my-book';               // snapshot folder prefix: book/<TITLE>.<stamp>/
const TRIM = { w: 4.25, h: 5.5 };      // inches — must match @page in src/styles.css
const FORMAT = 'quarter-portrait';     // crown layout -f …  (null: no imposition)
const IMPOSITION = 'zine';             // zine | cover | magic
const STRIP_DECOY = true;              // first page is src/content/000-decoy.md
const EXPECT_PAGES = null;             // exact count after stripping, or null → "multiple of 4"
const RAW = 'dist/book.pdf';           // output.pdf in crown.config.js
const OUT = 'book';                    // snapshot root
const KEEP = ['book.html', 'styles.css', 'fonts'];   // dist/ artifacts copied beside the PDF
// --------------------------------------------------------------------------

const ROOT = resolve(import.meta.dirname, '..');
const rawPdf = join(ROOT, RAW);
const skipLayout = process.argv.includes('--no-layout');

execSync('npx crown build', { cwd: ROOT, stdio: 'inherit' });

const stamp = (() => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
})();

const snap = join(ROOT, OUT, `${TITLE}.${stamp}`);
await mkdir(snap, { recursive: true });

// Strip the decoy and write the ordered, trim-size book
const doc = await PDFDocument.load(await readFile(rawPdf));
if (STRIP_DECOY) doc.removePage(0);
const pages = doc.getPageCount();

const [first] = doc.getPages();
const w = +(first.getWidth() / 72).toFixed(3);
const h = +(first.getHeight() / 72).toFixed(3);
// 0.01 in tolerance: a sixth-letter page is 3.667 in, written 3.67 everywhere
if (Math.abs(w - TRIM.w) > 0.01 || Math.abs(h - TRIM.h) > 0.01) {
  console.warn(`⚠️  trim is ${w} × ${h} in, expected ${TRIM.w} × ${TRIM.h} — check @page in src/styles.css`);
}

if (EXPECT_PAGES !== null && pages !== EXPECT_PAGES) {
  throw new Error(`Expected ${EXPECT_PAGES} pages after stripping the decoy, got ${pages} — check src/content/`);
}
if (IMPOSITION === 'cover' && pages !== 4) {
  throw new Error(`A wrap cover must be exactly 4 pages, got ${pages} — check src/content/ ordering`);
}
if (IMPOSITION === 'magic' && pages !== 8) {
  throw new Error(`A magic zine must be exactly 8 pages, got ${pages}`);
}
if (EXPECT_PAGES === null && IMPOSITION === 'zine' && pages % 4 !== 0) {
  console.warn(
    `⚠️  ${pages} pages after stripping the decoy — not a multiple of 4. ` +
      'Add or remove a blank page in src/content/ (before the back cover) before printing.'
  );
}

const bookPdf = join(snap, 'book.pdf');
// useObjectStreams: false for print-app compatibility
await writeFile(bookPdf, await doc.save({ useObjectStreams: false }));

// Keep the rendered HTML, CSS and fonts beside the PDF for the record
const distDir = resolve(ROOT, RAW, '..');
for (const artifact of KEEP) {
  const src = join(distDir, artifact);
  if (existsSync(src)) await cp(src, join(snap, artifact), { recursive: true });
}

console.log(`\n📕 ${relative(ROOT, bookPdf)} (${pages} pages, ${w} × ${h} in${STRIP_DECOY ? ', decoy stripped' : ''})`);

// Impose onto letter sheets for folding and stapling
if (FORMAT && !skipLayout) {
  const sheets = join(snap, 'sheets.pdf');
  execSync(`npx crown layout "${bookPdf}" -f ${FORMAT} -i ${IMPOSITION} -o "${sheets}"`, {
    cwd: ROOT,
    stdio: 'inherit',
  });
  console.log(`🖨  ${relative(ROOT, sheets)} (${FORMAT} ${IMPOSITION} on letter)`);
}
