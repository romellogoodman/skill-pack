# My Book

One paragraph on what the book is. Built with [crown](../crown) and PrinceXML.

## Build

```bash
npm install       # crown is linked from ../crown
npm run build     # → book/my-book.<stamp>/{book,sheets}.pdf
npm run dev       # live preview at localhost:<port> (devServer.port in crown.config.js)
```

Requires [PrinceXML](https://www.princexml.com/) on your PATH
(`brew install --cask prince`). Every build lands in its own timestamped
folder under `book/`; nothing is overwritten.

- `book.pdf` — ordered, trim-size pages. Proof this one.
- `sheets.pdf` — the same pages imposed 2 × 2 on letter. Print this one
  double-sided (flip on the **long** edge), cut each sheet in half, fold,
  nest, staple.

## Print specs

- **Trim:** 4.25 × 5.5 in (Quarter Letter Portrait)
- **Pages:** 8 — a multiple of 4; cover = 1, back cover = 8
- **Sheets:** 1 letter sheet, duplex
- **Ink:** black only

## Pages

| pp. | |
|---|---|
| 1 | cover |
| 2 | epigraph |
| 3 | introduction |
| 4–5 | chapter |
| 6 | colophon |
| 7 | blank |
| 8 | back cover |

## Gotchas

- Crown only injects the config `@page` when the stylesheet has none, so
  page geometry lives in `src/styles.css`; the `page` block in
  `crown.config.js` is documentation.
- The document's first page is a decoy (`src/content/000-decoy.md`) that
  absorbs Prince's non-commercial logo and is stripped after the build.
  `.decoy { counter-reset: page 0 }` keeps folios honest.
- Prince ignores `ch` units in `text-indent` (use em) and the
  `hyphenate-limit-chars` shorthand (use `prince-hyphenate-*`).
