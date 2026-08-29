# The books — what exists and what to crib

Everything under `~/code/book-*` as of 2026-08-29. Each is a sibling of `~/code/crown` and links it with `file:../crown`. Read a book's own `CLAUDE.md` before editing it; this page is for finding which one already solved your problem.

| repo | object | trim | pages | type | build | imposition |
|---|---|---|---|---|---|---|
| `book-weave-watch-wait` | essay, first printing July 2026 | 4.25 × 5.5 | 20 | Alegreya (Proportional Web) | `crown build && strip-decoy.mjs` → `book/<stamp>/` | external app (predates `crown layout`) |
| `book-drawing-instructions` | Sol LeWitt-style workbook, one prompt per page | 4.25 × 5.5 | 24 | Public Sans | `scripts/build.mjs` → `book/<stamp>/{book,sheets}.pdf` | `crown layout -f quarter-portrait` |
| `book-piet-stickers` | letter sheet of 20 generative SVGs | 8.5 × 11 | 1+ | (none, grid) | `npm run render` (onyx) then `crown build` | none |
| `book-flora-figures` | 8 × 8 photo book, riso printed | 8 × 8 | data-driven | — | Next.js editor → `pages.json` → `crown:build` | none (sent to printer) |
| `book-how-i-made-flora-figures` | one-sheet landscape pamphlet | 11 × 8.5 | 2 | Alegreya | `scripts/build.mjs` (asserts 3 → 2 pages) | none |
| `book-wobble-of-the-pen` | editions of hand-bound mini books from scans; crown only for the cover and the sheets | 4.25 × 3.67 (6up) / 4.25 × 5.5 (4up) | 36 / 32 per book | Alegreya (cover) | own pdf-lib pipeline; `cover/` is a crown project | `crown layout -f sixth` / `-f quarter-portrait`, `-i cover` |

## book-weave-watch-wait — the text book

The essay (~2,100 words) in one file per section, ordered by `order`; `template: cover | back-cover | front-matter` plus `class: decoy | epigraph | colophon | blank` choose the partial and styling. `src/styles.css` is the reference typography for every prose book since: the print translation of *The Proportional Web* (table in its README), `float: bottom` asides, epigraph sunk 8 lines, chapter openers sunk 3, lozenge ornament on `<hr>`, oldstyle folios, references in the code face. Swapped `margin-inside`/`outside` on purpose (decoy parity). Crib: `styles.css`, the four partials, `01-epigraph.md`, `08-colophon.md`, `09-back-cover.md`, and the CLAUDE.md *Invariants* wording.

## book-drawing-instructions — the workbook and the newest build

Fifteen prompts, one per page, `template: prompt` with `section` and `number` frontmatter rendered by `partials/prompt.html` (a labelled header + big bold body); `template: divider` opens each group. Symmetric margins; `.intro p { hyphens: manual }`. `scripts/build.mjs` is the most complete build script — crown build → strip → trim check → multiple-of-4 warning → snapshot with html/css/fonts → `crown layout` — and is the ancestor of this skill's `assets/zine/scripts/build.mjs`. Its README has the page table and print specs to copy. Canonical text lives in `~/Documents/art-files/drawing-instructions/`; edit there first.

## book-piet-stickers — the data-driven sheet

One content file whose only job is frontmatter (`perPage: 20`); `data.pieces` from a JSON index; `helpers.js` adds `chunk`; the template nests `{{#each (chunk @root.data.pieces …)}}` into `<section class="sheet">`s with a CSS grid. The per-sheet colophon flows through `string-set` into `@bottom-center`. `scripts/render.mjs` renders the SVGs headlessly from `../onyx` with a stride through seed space (the README explains the LCG reason). `input.assets: 'src/pieces'`. Not a git repo yet as of today. Crib: the grid + helper + `string-set` trio, and the "start clean, then render" script shape.

## book-flora-figures — the image book with an editor

Two apps in one repo: a Next.js editor (`app/`, port 8080) that reads/writes `src/book.json` (pages, named layouts, `activeLayout`) and serves images from `~/Documents/art-files/flora-figures`; and crown, whose template iterates `data.book.pages` by `type` (`single`, `grid`, `grid3x3`, `grid4x4`, `blank`) with sizes hard-coded for an 8 × 8 page. Images are outside the repo: `prince.options: ['--fileroot=…']` and bare `/file.jpg` srcs. `javascript: true`. `words/` is a second crown config for the text pages (`crown build -c words/crown.config.js`), set in Public Sans. Crib: page-type dispatch for images, `--fileroot`, the second-config pattern, `words/content/00-page.md` for bio + colophon copy.

## book-how-i-made-flora-figures — the pamphlet

Front: Cow Tools figure, title block, three columns (`column-count: 3`, explicit `height: 7.5in`, `column-fill: auto`) of body copy with `### ` sub-heads. Back: side bands sampled from the image's edge colours, an 8.5 in square full-bleed image, a caption rotated with `transform`. Dummy page is `order: 0` and the strip asserts exactly 3 pages. Its README lists four Prince quirks that are now in `prince-gotchas.md`. Crib: multicol, full-bleed layout, the timestamped single-file output.

## book-wobble-of-the-pen — editions, and the cover

Not a crown book for its pages: three numbered scripts turn scans into cropped windows into shuffled, seeded, per-book PDFs (`manifest.*.json` is the source of truth; `EDITION.md` explains why 32 pages and why ten books). Crown enters twice: `cover/` is a four-page wrap cover at the 6up trim (no `defineConfig` import; `finalize.mjs` asserts exactly 4 pages; `npm run cover:sheet` imposes it with `-i cover`), and the print sheets come from `crown layout book/<run>/*.pdf -f sixth -o print/<run>/`. Crib: the wrap-cover project, the cover/back-cover partials with `.blurb` / `.edition` / `.site`, and the edition arithmetic when planning a run.

## crown's own scaffold

`~/code/crown/templates/default/` is what `crown create` produces: a 5.5 × 8.5 book with title/intro/chapter, `partials/title.html` + `chapter.html`, a plain stylesheet, and `.claude/skills/crown.md` (the API summary crown ships to new projects). It has none of the print conventions above — no decoy, no snapshot, config-driven `@page`. Use this skill's `assets/zine/` for a real book and the scaffold only as the minimal example of the API.
