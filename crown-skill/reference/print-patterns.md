# Print patterns — the house conventions

What the `~/code/book-*` projects have converged on, in the order a new book meets them. Each names the book that proves it, so read that file rather than reinventing.

## 1. The decoy page

Prince's non-commercial license stamps a small logo on the first page of every render. Every book opens with a blank page that exists only to absorb it, then strips that page with pdf-lib.

```markdown
---
title: Decoy
id: decoy
order: -1
template: plain
class: decoy
---

&nbsp;
```

```css
/* keep folios identical to a book that never had the decoy: cover = 1 */
.decoy { counter-reset: page 0; }
.decoy { page: unnumbered; }       /* and no folio on it */
```

```javascript
const doc = await PDFDocument.load(await readFile(RAW));
doc.removePage(0);
await writeFile(OUT, await doc.save({ useObjectStreams: false }));   // print-app compatibility
```

Consequences, all deliberate:

- **Parity shifts by one.** With the decoy attached, the cover is Prince's page 2 — a left page. Two remedies exist: keep left/right margins symmetric so the shift has nothing to break (`book-drawing-instructions`, `book-piet-stickers`, the wobble cover, the kit), or swap `margin-inside`/`margin-outside` in `@page` so they land right after the strip (`book-weave-watch-wait`, which wanted a 0.5 in gutter). Whichever a book chose, its `CLAUDE.md` says so; don't "correct" it.
- **The strip script asserts.** Expected count (`how-i-made-flora-figures` asserts exactly 3 → 2; the wobble cover asserts 5 → 4), multiple-of-4 warning (zines), and trim size read back from the first page (`getWidth()/72`).
- `.decoy` is also `page: unnumbered` so no folio prints on it (irrelevant once stripped, tidy in the raw).

If the print run ever goes commercial, buy a Prince license and delete the decoy, the counter reset and the strip step together.

## 2. Page geometry lives in `styles.css`

Crown prepends a generated `@page` to the stylesheet **only when the stylesheet contains no `@page {`**. Every book writes its own, because margin boxes, named pages and `:left`/`:right` need it. The `page` block in `crown.config.js` is kept as documentation, with a comment saying so — keep it in step with the CSS.

```css
@page {
  size: 4.25in 5.5in;
  margin: 0.45in 0.45in 0.55in;           /* symmetric — see §1 */
  @bottom-center { content: counter(page); font-size: 8.5pt; }
}
@page unnumbered { @bottom-center { content: none; } }
.cover, .back-cover, .epigraph, .colophon, .blank, .decoy { page: unnumbered; }
```

Trim sizes in use: 4.25 × 5.5 (quarter letter; weave, drawing-instructions), 4.25 × 3.67 (sixth; wobble cover), 8 × 8 (flora), 8.5 × 11 (piet), 11 × 8.5 (how-i-made). Match the size to a `crown layout` format if the book will be imposed.

## 3. One file per section, dispatched by frontmatter

An essay is one file per section (`book-weave-watch-wait`); a workbook or cover is one file per page (`book-drawing-instructions`, wobble cover). Filenames are numbered for humans (`00-cover.md`, `03-weave.md`, `08b-blank.md`), but **`order` decides** — a number, fractional if you must (`order: 8.5`).

Frontmatter conventions crown doesn't know about but every book uses:

| key | meaning |
|---|---|
| `template: cover \| back-cover \| plain \| front-matter \| divider \| prompt` | which partial renders it (default partial otherwise) |
| `class: decoy \| epigraph \| colophon \| blank \| intro` | extra class on the `<section>` |
| `section`, `number` | per-page labels (drawing-instructions prompts) |
| `perPage` | items per sheet for a data-driven grid (piet) |

Partials are one `<section>` each, called from `layout.html` with the `{{> name this}}` at **column 0** (Handlebars indents a standalone partial's output by the call's indentation, which breaks `<pre>`), e.g. `partials/chapter.html`:

```html
<section class="chapter {{frontmatter.class}}" id="{{frontmatter.id}}">
  {{{html}}}
</section>
```

Cover, epigraph, colophon and back cover are written as raw HTML inside the Markdown (`<p class="author">`, `<blockquote><footer>`, `<br>` in titles) because Markdown can't reach those classes.

## 4. Typography

Two families in use, both self-hosted under `src/fonts/` (`input.assets`), referenced as `url("fonts/…")`:

- **Alegreya + Alegreya SC + Courier Prime** — the print translation of Oskar Wickström's *The Proportional Web* (`book-weave-watch-wait/src/styles.css`, reused by the wobble cover and the pamphlet). 10pt on a 14pt baseline; every margin and line-height a multiple of `--line-height`; justified with `hyphens: auto` and `p + p { text-indent: 1.5em }` (not `3ch` — Prince ignores `ch` there); small-caps headings with a hairline rule; oldstyle figures including folios; `<aside>` as `float: bottom`; the lozenge ◊ as ornament.
- **Public Sans** (one variable file) for workbooks and captions (`book-drawing-instructions`, flora *words*). Ragged right, `hyphens: manual`, prompts set large and bold.

Ink is black only — every book is designed to print on a laser printer or one riso drum. Source Markdown uses real typographic quotes and dashes; crown does no smartypants.

## 5. The page plan and the multiple of four

A folded book has 4 pages per folio, so the stripped PDF must be a multiple of 4 with the cover on page 1 and the back cover last. Plan it as a table in the README before writing (from `book-drawing-instructions`):

```
| pp.   |                 |
| 1     | cover           |
| 2     | epigraph        |
| 3     | introduction    |
| 4–21  | …               |
| 22    | colophon        |
| 23    | blank           |
| 24    | back cover      |
```

Pad with explicit blank files (`98-blank.md`, `08b-blank.md`) placed **before** the back cover — `crown layout` pads after the last page, which would put blanks after the back cover. The build script warns when the count drifts; re-check it whenever content grows.

## 6. Timestamped snapshots

`npm run build` never overwrites: each run writes `book/<title>.<YYYY-MM-DD-HHMMSS>/` containing `book.pdf` (stripped, trim-size — the file to proof), `sheets.pdf` (imposed — the file to print), and `book.html`, `styles.css`, `fonts/` copied beside them for the record. `dist/` is the raw crown output and is gitignored; the snapshot PDFs are committed (they are the edition). `assets/zine/scripts/build.mjs` in this skill is the shared script; `book-weave-watch-wait/scripts/strip-decoy.mjs` is the earlier form without imposition.

`package.json` scripts, the same in every book: `dev`, `build` (the script), `build:raw` (`crown build` only), `watch`, `preview:html`, `preview:pdf`, `doctor`. Ports: 3000 weave & piet, 3001 flora words, 3002 how-i-made, 3003 drawing-instructions, 3004 the kit. `devServer.open: false` is the norm.

## 7. Data-driven pages

When the pages are records rather than prose, drive the template from `data`:

- **Grid of images** (`book-piet-stickers`): `data: { pieces: './src/data/pieces.json' }`, a `chunk(array, n)` helper in `src/templates/helpers.js`, `perPage` in the one content file's frontmatter, and the template iterates `(chunk @root.data.pieces entry.frontmatter.perPage)` into one `<section class="sheet">` per page. Per-sheet running text goes through `string-set: colophon attr(data-colophon)` on the section and `@bottom-center { content: string(colophon) }` in `@page`.
- **Photo book** (`book-flora-figures`): a Next.js editor writes `src/book.json`; a build route resolves the active layout into `src/pages.json`; the template iterates `data.book.pages` with `type: single | grid | grid3x3 | grid4x4 | blank`. Images live outside the repo, reached with `prince.options: ['--fileroot=/Users/…/art-files/flora-figures']` and bare `/filename.jpg` srcs. `javascript: true` there because the template needs it — leave it `false` everywhere else.
- **Companion book in the same repo** (`flora-figures/words/`): a second `crown.config.js` in a subfolder, run with `crown build -c words/crown.config.js`, outputs pointed at `../dist/`.
- **Generated inputs** (`piet`, `wobble`): a `scripts/render.mjs` or a numbered pipeline produces the images and the JSON first; `npm run render` then `npm run build`. Rendering starts clean so a smaller batch leaves no stale pieces.

## 8. Wrap covers

A cover for an imposed zine is its own tiny crown project at the book's trim (`book-wobble-of-the-pen/cover/`): four content files in order — front cover, inside front (blank), inside back (blank), back cover — plus the decoy; symmetric margins; `@page { @bottom-center { content: none } }` so nothing carries a folio; `finalize.mjs` strips the decoy and **throws unless exactly 4 pages remain**. Then `crown layout dist/cover.pdf -f sixth -i cover` lays the wrap out and fills the sheet with copies. The blurb, edition line and site line are `<p class="blurb">` / `.edition` / `.site` in the Markdown.

## 9. Flat sheets and pamphlets

Nothing to fold: a letter sheet of stickers (`book-piet-stickers`) or a one-sheet landscape pamphlet (`book-how-i-made-flora-figures`). The pamphlet is two pages (front, back) plus the dummy; the front is a fixed-height `column-count: 3` box, the back a full-bleed image with a caption rotated by `transform: rotate(90deg)`. Full-bleed pages use `@page { margin: 0 }` and a `.page { width: 11in; height: 8.5in; overflow: hidden }` container with explicit `break-after: page`.

## 10. Imposition and the print instructions

`crown layout book.pdf -f <format> -o sheets.pdf` (see `crown-api.md` for the table). Every README carries the same four lines for the printer:

> `sheets.pdf` — print double-sided, flip on the **long** edge (portrait sheet) / **short** edge (landscape). Cut each sheet in half / into thirds. Fold each half into a folio, nest them, staple through the fold.

Verify imposition by reading page numbers off the rendered sheets, never by looking at art. `--marks` draws trim and fold ticks if the printer needs them. Editions of many books (wobble) impose a whole directory at once: `crown layout book/<run>/*.pdf -f sixth -o print/<run>/`.

## 11. Repo hygiene

Each book has: a `CLAUDE.md` with *Commands*, *Map*, *Invariants* (the non-obvious things — decoy, parity, geometry-in-CSS, page count, where the canonical text lives); a `README.md` with build, print specs, page table and gotchas learned the hard way; `.gitignore` of `node_modules/ dist/ *.log .DS_Store`. Canonical text that lives elsewhere (a Google Doc export in `~/Documents/art-files/…`) is named in both, with the rule "edit there first, then mirror here".
