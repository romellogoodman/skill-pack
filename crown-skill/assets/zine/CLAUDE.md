# My Book

A quarter-letter zine (4.25 × 5.5 in, 8 pages) — one line on what it is —
built with **crown** (`../crown`, linked via `file:`) and PrinceXML.
README.md has the page plan and print specs.

## Commands

- `npm run build` — crown build + decoy strip + snapshot + `crown layout`
  → `book/my-book.<stamp>/book.pdf` (proof) and `sheets.pdf` (print)
- `npm run build:raw` — crown only → `dist/book.pdf`, decoy still attached
- `npm run dev` — live preview at localhost:3004
- Requires `prince` on PATH (`brew install --cask prince`)

## Map

- `src/content/*.md` — one file per section, ordered by `order` frontmatter;
  `template` / `class` frontmatter pick the partial in `src/templates/partials/`
- `src/styles.css` — all typography **and** all page geometry (`@page`)
- `src/fonts/` — Alegreya, Alegreya SC, Courier Prime (copied to `dist/fonts/`)
- `scripts/build.mjs` — crown build, strip the decoy, snapshot, impose;
  `TITLE` / `TRIM` / `FORMAT` at the top

## Invariants — read before editing

- Page geometry lives ONLY in `src/styles.css` (`@page`); crown skips the
  config `page` block whenever the stylesheet has any `@page`.
- The first content file is a decoy (`000-decoy.md`, `order: -1`) that
  absorbs the Prince non-commercial logo; `scripts/build.mjs` strips it.
  Margins are symmetric so the left/right parity shift it causes has
  nothing to break, and `.decoy { counter-reset: page 0 }` keeps folios
  honest (cover = 1).
- The stripped PDF must be a multiple of 4 pages, cover first, back cover
  last. `98-blank.md` pads; add or remove blanks *before* the back cover.
  The build script warns when the count drifts.
- `order` is a YAML number. Source Markdown uses real typographic quotes
  and dashes — crown does no smart-quote conversion.
- After any change, rebuild and proof the snapshot PDF page by page
  (`pdftoppm -r 40 -png book/<snapshot>/book.pdf /tmp/proof/p`), not just
  the build output.
