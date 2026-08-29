# Prince — what works, what silently doesn't

Prince 16.2 (`/opt/homebrew/bin/prince`, `brew install --cask prince`). Full docs: https://www.princexml.com/doc/ and the long local guide at `~/code/crown/docs/princexml-guide.md`. This file is the part the books actually lean on, plus every quirk that cost an afternoon.

## Paged-media CSS the books use

```css
/* geometry — inside/outside are the duplex-aware pair */
@page { size: 4.25in 5.5in; margin-top: .45in; margin-bottom: .55in; margin-inside: .5in; margin-outside: .4in; }

/* folios in a margin box; 16 boxes exist: @top-left … @bottom-right, @left-top … @right-bottom */
@page :left  { @bottom-center { content: counter(page); } }
@page :right { @bottom-center { content: counter(page); } }
@page :first { @top-center { content: none; } }

/* named pages: opt an element out of the folio */
@page unnumbered { @bottom-center { content: none; } }
.cover, .blank { page: unnumbered; }

/* reset the counter on an element (the decoy trick) */
.decoy { counter-reset: page 0; }

/* running text from the document into a margin box */
.sheet { string-set: colophon attr(data-colophon); }
h1     { string-set: chapter-title content(); }
@page  { @bottom-center { content: string(colophon); } }

/* breaks — both spellings work */
.chapter { page-break-before: always; }   /* or break-before: page */
h1 { break-before: recto; break-after: avoid; }  /* recto = right-hand page */
blockquote, pre, figure { break-inside: avoid; }
p { widows: 2; orphans: 2; }

/* page floats: asides to the foot of the page they're on */
aside { float: bottom; }                  /* also: float: top; float: footnote */

/* footnotes */
.fn { float: footnote; }
.fn::footnote-call { content: counter(footnote); vertical-align: super; font-size: 80%; }
@page { @footnote { border-top: .5pt solid; padding-top: 4pt; } }

/* table of contents / cross-references */
.toc a::after { content: leader('.') target-counter(attr(href), page); }
h1 { bookmark-level: 1; }                 /* PDF bookmarks */

/* hyphenation — the shorthand is ignored, the prince-* properties work */
p { hyphens: auto; prince-hyphenate-before: 3; prince-hyphenate-after: 3; prince-hyphenate-lines: 2; }

/* columns (the pamphlet) */
.body { column-count: 3; column-gap: .3in; column-fill: auto; height: 7.5in; }

/* variable fonts */
@font-face { font-family: "Alegreya"; src: url("fonts/Alegreya[wght].ttf"); font-weight: 400 900; font-style: normal; }

/* OpenType features */
body { font-variant-numeric: oldstyle-nums; }

/* a draft watermark */
@page { @prince-overlay { content: "PROOF"; font-size: 96pt; color: rgba(0,0,0,.08); transform: rotate(-45deg); } }
```

`<html lang="…">` must be set (the layout uses `{{metadata.lang}}`) or nothing hyphenates.

## Verified quirks — don't rediscover these

| symptom | cause | fix | seen in |
|---|---|---|---|
| paragraph indent doesn't appear | Prince ignores `ch` units in `text-indent` | use `em` (`1.5em` ≈ the web's `3ch`) | weave |
| no gap after a list bullet | `ch` is dropped in `margin` too | `margin-right: 0.5em` on the `::before` | kit |
| hyphenation limits have no effect | `hyphenate-limit-chars` shorthand isn't honoured | `prince-hyphenate-before/after/lines` | weave, how-i-made |
| rotated caption is missing | `writing-mode: vertical-rl` drops the text | `transform: rotate(90deg)` on a positioned block | how-i-made |
| text in column 1 clips at the bottom | `flex: 1` doesn't resolve as a height for a multicol box | give the column container an explicit `height` | how-i-made |
| logo on page 1 | non-commercial license stamp | decoy page + strip (print-patterns §1) | all |
| folios off by one, gutter on the wrong side | the decoy shifts left/right parity | symmetric margins, or swap inside/outside, and `.decoy { counter-reset: page 0 }` | weave, drawing-instructions |
| config `page` size ignored | stylesheet already has an `@page` — crown only injects when it has none | edit `@page` in `styles.css` | all |
| images 404 in the PDF but fine in a browser | paths are resolved from `dist/book.html`; Prince can't see the project root | keep images beside content/templates (auto-copied), use `input.assets`, or `prince.options: ['--fileroot=/abs/dir']` | flora, piet |
| fonts fall back to Times | `url("src/fonts/…")` — but the CSS is served from `dist/` beside `dist/fonts/` | `url("fonts/…")` with `input.assets: 'src/fonts'` | kit |
| `<script>` in the template does nothing | JavaScript is off by default | `prince.javascript: true` — only for content you trust | flora |
| PDF opens in Preview but a print app rejects it | pdf-lib object streams | `doc.save({ useObjectStreams: false })` | wobble, all strip scripts |
| pdf-lib says "SOI not found" on a good JPEG | small reads share Node's buffer pool at a non-zero offset | `embedJpg(new Uint8Array(readFileSync(f)))` | wobble |
| imposed blanks land after the back cover | `crown layout` pads at the end | explicit blank file before the back cover | drawing-instructions |
| a `.scss` edit rebuilds but changes nothing | watched, not compiled | write CSS, or compile Sass yourself and point `input.styles` at the output | crown docs |
| an `order` is ignored | `order: "3"` is a string | unquoted YAML number; check the build log for the warning | crown src |
| a code block's second line is indented, or `<pre>` whitespace is wrong | Handlebars indents every output line of a *standalone* partial call by the call's own indentation, and crown compiles without `preventIndent` | put `{{> partial this}}` calls at column 0 in `layout.html` (the kit does); the proper fix is `compile(src, { preventIndent: true })` in crown's `template.ts` | kit |

Things that *do* work and are safe to use: CSS grid and flexbox for page layout, `object-fit: cover` on images, `transform`, `position: absolute` inside a fixed-size page box, SVG `<img>`, `calc()` with `pt` and `in`, `::before`/`::after` content, `counters()`, `@font-face` with variable-font weight ranges, `font-variant-numeric`.

## Proofing without guessing

```sh
# every page of a finished PDF as PNGs (poppler)
pdftoppm -r 40 -png book/<snapshot>/book.pdf /tmp/proof/p
pdfinfo book/<snapshot>/book.pdf        # Pages: N   Page size: 306 x 396 pts (= 4.25 x 5.5 in)

# straight from the HTML, no PDF step — useful in a dev loop
prince dist/book.html --raster-output=/tmp/proof/p_%02d.png --raster-format=png --raster-dpi=40 --raster-pages=all
```

Then `Read` the PNGs. Things only a rendered page shows: a heading orphaned at the foot, an aside floated to the wrong page, a folio on a page that should be unnumbered, justified rivers, clipped columns, a cover title wrapping badly. 40 dpi is enough to check structure; use 150 for type.

`crown build --verbose` (`-v`) passes `--verbose` to Prince, which reports unsupported properties and missing fonts — read it when a style "doesn't apply".

## Resolution and images

Print wants ≥ 300 dpi at the placed size: a 4.25 in wide page needs a 1275 px image; a 6up window at 4.25 × 3.67 needs 1275 × 1100. `book-wobble-of-the-pen` gates crops on `MIN_DPI` in `scripts/01-process.mjs` for exactly this reason. Prince embeds JPEG as-is and re-encodes PNG losslessly; it doesn't downsample, so huge sources make huge PDFs.
