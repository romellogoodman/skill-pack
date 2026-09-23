---
name: crown
description: Make and maintain printed books with Crown — Romello's Markdown + Handlebars + CSS → PrinceXML → PDF framework at ~/code/crown — and impose the pages onto press sheets with `crown layout`. Use when starting a new book, zine, pamphlet, wrap cover or sticker sheet; editing content or design in an existing ~/code/book-* project; building, proofing, imposing or printing a PDF; debugging Prince paged-media CSS; or changing crown itself. Carries the house conventions every book shares (decoy page for the Prince stamp, @page in styles.css, timestamped snapshots, multiple-of-4 page counts, template dispatch by frontmatter) plus a starter zine kit and the shared build script.
allowed-tools: Read Write Edit Glob Grep Bash(ls *) Bash(cat *) Bash(cp *) Bash(mkdir *) Bash(git init*) Bash(npm *) Bash(npx *) Bash(crown *) Bash(node *) Bash(prince *) Bash(pdftoppm *) Bash(pdfinfo *) Bash(open *)
---

# Crown

Crown turns a folder of Markdown into a print-ready PDF: `src/content/*.md` → a Handlebars `layout.html` → one `styles.css` → PrinceXML. A second command, `crown layout`, takes any PDF of finished pages and imposes them onto letter sheets to cut, fold and staple. The framework lives at `~/code/crown` (`@romello/crown` 0.1.0); every book is a sibling repo named `~/code/book-<slug>` that links it with `"@romello/crown": "file:../crown"`.

Crown's README documents the API. The six books document what it takes to get a stapled zine out the other end. This skill folds both together.

## What ships here

```
reference/crown-api.md        config, CLI, template context, helpers — checked against src/ at crown cae5792
reference/print-patterns.md   the house conventions, each with the book that proves it
reference/prince-gotchas.md   paged-media CSS that works in Prince 16, and what silently doesn't
reference/books.md            the six books: trim, format, pipeline, what to crib from each
assets/zine/                  starter for a quarter-letter zine with every convention in place
assets/zine/scripts/build.mjs crown build → strip decoy → timestamped snapshot → impose (the script the books share)
```

## Ground truth — read before doing anything

- **Prince stamps page 1.** The Prince license here is non-commercial, so every render carries a small logo on its first page. Every book opens with a sacrificial blank (`src/content/000-decoy.md`) that absorbs it and strips that page with pdf-lib after the build. The consequences ripple into margins, folios and page counts — read `print-patterns.md` §1 before touching any of those.
- **Geometry lives in `styles.css`.** Crown injects an `@page` from `crown.config.js` only when the stylesheet has none (it tests `/@page\s*\{/`). Every book declares its own `@page`, so the config `page` block is documentation. Edit the CSS.
- **Crown is a symlink.** `node_modules/@romello/crown → ../../crown` (older books alias it as `crown`). Books run crown's `dist/`, so after any change to crown's source run `npm run build` in `~/code/crown` or the books keep running the old code. `crown` is also on PATH globally.
- **`npx crown doctor`** confirms Node, the config and `prince` (16.2 at `/opt/homebrew/bin/prince`). The kit's `scripts/build.mjs` uses `import.meta.dirname`, so it needs Node 20.11 or newer.

## Which job is this?

| Asked to… | Section |
|---|---|
| start a new book, zine, pamphlet, cover, sticker sheet | **Start a book** |
| change words, pages, type or layout in an existing `book-*` | **Work in an existing book** |
| build, proof, impose, print | **Build, proof, impose** |
| add a feature or fix a bug in crown | **Change crown** |

## Start a book

1. **Decide the physical object first.** Trim, page count and sheet count fall out of the format; text, type and margins are chosen to fit it, never the reverse.

   | object | trim | `crown layout` | pages per letter sheet |
   |---|---|---|---|
   | quarter-letter zine — the default, 3 of 6 books | 4.25 × 5.5 in | `-f quarter-portrait` | 8 |
   | half-letter book | 5.5 × 8.5 in | `-f half` | 4 |
   | sixth-letter mini | 4.25 × 3.67 in | `-f sixth` | 12 |
   | eighth-letter / one-sheet magic zine | 2.75 × 4.25 in | `-f eighth-portrait` / `-f magic -i magic` | 16 / 8 one side |
   | tall strip zine | 2.75 × 8.5 in | `-f quarter-strip` | 8 |
   | 4-page wrap cover at the book's trim | as the book | `-f <same> -i cover` | fills the sheet with copies |
   | flat sheet — stickers, pamphlet, poster | 8.5 × 11 or 11 × 8.5 | none | 1 |

   Anything folded needs a page count that is a **multiple of 4**, cover first, back cover last. Write the page plan into the README as a table (`book-drawing-instructions` is the model) before writing content.

2. **Scaffold from the kit** for a zine or book:
   ```sh
   cp -r <this-skill-dir>/assets/zine ~/code/book-<slug>
   cd ~/code/book-<slug> && git init
   ```
   Then edit: `package.json` name and description; `crown.config.js` metadata and a `devServer.port` no sibling uses (3000 weave & piet, 3001 flora words, 3002 how-i-made, 3003 drawing-instructions, 3004 the kit); the `TITLE` / `TRIM` / `FORMAT` block at the top of `scripts/build.mjs`; `@page` in `src/styles.css` if the trim isn't quarter-letter; the `<N>` pages and `<port>` placeholders in `CLAUDE.md`. For a flat sheet, a data-driven book or a wrap cover, copy the closest sibling named in `books.md` instead — `crown create` gives a bare project with none of the print conventions.

3. **Fonts.** The kit's `styles.css` expects Alegreya, Alegreya SC and Courier Prime (OFL, 2.4 MB) in `src/fonts/`:
   ```sh
   cp ~/code/book-weave-watch-wait/src/fonts/* src/fonts/
   ```
   For a sans book, Public Sans is one variable file — `~/code/book-drawing-instructions/src/fonts/PublicSansVF.ttf` — and its `@font-face` block is in that book's `styles.css`. Fonts are referenced as `url("fonts/…")` because `dist/styles.css` sits beside `dist/fonts/` (`input.assets: 'src/fonts'`).

4. **Install and look.**
   ```sh
   npm install && npx crown doctor && npm run dev
   ```
   `dev` serves the PDF in an iframe and rebuilds on save. Write the content, then **Build, proof, impose**.

5. **Fill in `CLAUDE.md`** — the kit's template has an *Invariants* section; that section is what saves the next session. Keep the README's page table and print specs current as the book grows.

## Work in an existing book

1. **Read the book's `CLAUDE.md` and `README.md` first.** Each has an *Invariants* or *Gotchas* section written after something broke. Two things look wrong and aren't: swapped `margin-inside` / `margin-outside` (weave-watch-wait) and `.decoy { counter-reset: page 0 }` (all of them). Don't fix them.
2. **Content** is one file per section (an essay) or per page (a workbook, a cover), ordered by frontmatter `order` — a YAML number, or crown drops it with a warning. `template:` picks the partial, `class:` adds a class to the section; raw HTML inside Markdown is normal and is how covers, epigraphs and asides are written. Use real typographic quotes and dashes — crown does no smart-quote conversion.
3. **Design** edits go in `src/styles.css` only. Every vertical measure is a multiple of the baseline unit (`--line-height`, 14pt in the text books); pages that carry no folio use `page: unnumbered`. Prince has its own ideas about some CSS — check `prince-gotchas.md` before fighting a layout for more than a few minutes.
4. **Rebuild and proof after any change** (next section). Page breaks, floated asides and folios only show in the PDF, never in the build log.
5. **Borrow, don't reinvent.** `books.md` names which book already has a working cover, epigraph, one-prompt-per-page template, data-driven grid, running margin-box text, three-column pamphlet or wrap cover.

## Build, proof, impose

```sh
npm run build        # crown build → strip decoy → book/<title>.<stamp>/{book,sheets}.pdf
npm run build:raw    # crown only → dist/book.pdf, decoy still attached
```

Every build lands in its own timestamped folder under `book/`; nothing is overwritten, and the finished PDFs are kept in git (the raw `dist/` is not). `book.pdf` is the ordered, trim-size file to **proof**; `sheets.pdf` is the imposed file to **print**.

**Proof every page — the build log can't.** Rasterize and read the pages:

```sh
mkdir -p /tmp/proof                                          # pdftoppm won't create it
pdftoppm -r 40 -png book/<snapshot>/book.pdf /tmp/proof/p     # p-01.png, p-02.png …
pdftoppm -r 30 -png book/<snapshot>/sheets.pdf /tmp/proof/s   # the imposed sheets
pdfinfo  book/<snapshot>/book.pdf                              # page count and page size
```

Without a PDF, straight from the HTML: `prince dist/book.html --raster-output=/tmp/proof/p_%02d.png --raster-dpi=40` (page 1 is the decoy). `Read` the images and check: cover on page 1, back cover last; count a multiple of 4 (the build script warns); page size matches `@page`; no folio on cover, front matter or blanks; no heading orphaned at a page foot; each aside on the page its paragraph is on; nothing clipped. On `sheets.pdf`, read the page numbers off the cells to confirm the imposition order — art can't show an ordering bug.

**Impose** — `scripts/build.mjs` does this when `FORMAT` is set; by hand for a PDF made elsewhere:

```sh
crown layout book.pdf -f quarter-portrait -o sheets.pdf     # a zine, the default kind
crown layout cover.pdf -f sixth -i cover -o cover-sheet.pdf # a 4-page wrap cover, repeated to fill
crown layout pages/*.pdf -f sixth -o print/                 # a whole edition into a directory
crown layout --list
```

The command prints which edge to flip on. For the README: print double-sided flipping on that edge, cut each sheet into its cells, fold each folio, nest them, staple through the fold.

## Change crown

Work in `~/code/crown` and follow its `CLAUDE.md` (tsdown build, vitest; two traps — `globBase()` not `dirname()` for `input.content`, and runtime files need a `copy` entry in `tsdown.config.ts`). Then:

```sh
cd ~/code/crown && npm test && npm run build     # books pick up dist/ through the symlink
```

If the user-facing API changed, update the three places that describe it: crown's `README.md`, the scaffolded skill at `templates/default/.claude/skills/crown.md` (which `crown create` copies into new projects), and this skill's `reference/crown-api.md`. Something two books need by hand — a helper, a build step, a layout option — belongs in crown, not copied between books.

## Gotchas, the short list

- `order` must be a YAML number. `order: "3"` is dropped with only a log warning, and the file sorts to the end.
- `helpers` in the config is a **path** to a module whose default export is an object of functions.
- Prince ignores `ch` in `text-indent` and the `hyphenate-limit-chars` shorthand; `writing-mode: vertical-rl` drops the text; `flex: 1` doesn't give a multicol box a height. Fixes in `prince-gotchas.md`.
- Save stripped PDFs with `useObjectStreams: false` — some print apps choke otherwise. The kit's `scripts/build.mjs` does.
- `crown layout` pads a short book with blanks *after the last page*, which lands them after the back cover. Pad with an explicit blank file before the back cover instead and let the build script's warning tell you when the count drifts.
- Changing `crown.config.js` needs a dev-server restart. `.scss` is watched but never compiled.
- Keep `{{> partial this}}` calls at column 0 in `layout.html`. Handlebars indents a standalone partial's whole output by the call's indentation, which corrupts `<pre>` blocks; crown doesn't set `preventIndent` (a one-line fix in `src/core/template.ts` if it bites).
