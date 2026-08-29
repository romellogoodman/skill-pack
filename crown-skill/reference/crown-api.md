# Crown API — as built

Checked line by line against `~/code/crown/src` at commit `cae5792` (`@romello/crown` 0.1.0, 2026-07-26) plus the uncommitted `quarter-strip` format present in the working tree on 2026-08-29. If crown has moved on, re-check the cited files before trusting a detail here; `~/code/crown/README.md` and `templates/default/.claude/skills/crown.md` are the other two descriptions and should agree with this one.

## Install and link

- Global: `crown` is on PATH (npm link from `~/code/crown`). `crown --version`, `crown doctor`.
- Per book: `"@romello/crown": "file:../crown"` in `dependencies` (plus `pdf-lib` if the build script strips a page). npm creates `node_modules/@romello/crown → ../../crown`, so the book runs crown's `dist/` — rebuild crown after editing it. Older books alias it as `"crown": "file:../crown"` and `import { defineConfig } from 'crown'`; both work.
- `defineConfig` is an identity function that exists for editor types. A plain `export default { … }` is equivalent (wobble-of-the-pen/cover does this to avoid a dependency).

## CLI (`src/cli/index.ts`)

| command | options |
|---|---|
| `crown create <name>` | `-t, --template <name>` (only `default` exists) |
| `crown dev` | `-c <config>` `-p, --port <n>` `--host <h>` `--open` / `--no-open` |
| `crown build` | `-c <config>` `-o, --output <pdf>` `-v, --verbose` (verbose = Prince's own output) |
| `crown watch` | `-c` — rebuild on change, no server |
| `crown preview:html` / `preview:pdf` | `-c` — open the built file |
| `crown doctor` | `-c` — Node, config, Prince on PATH |
| `crown layout [inputs...]` | `-f, --format <name>` (default `quarter-portrait`) `-s, --sheet <name>` (default `letter`) `-i, --imposition zine\|cover\|magic` `-o, --output <file or dir>` `--signature <pages>` `--duplex long\|short` `--marks` `--list` |

There is no `crown init`, `clean`, `config`, `--html-only` or `build --watch`. `-c` loads a file with `cosmiconfig.load()`; given a directory it searches.

## Config (`src/types/config.ts`, defaults in `src/core/config.ts`)

```javascript
import { defineConfig } from '@romello/crown';

export default defineConfig({
  input: {
    content: 'src/content/**/*.md',      // required — a glob
    template: 'src/templates/layout.html', // required
    styles: 'src/styles.css',            // required — ONE stylesheet
    assets: 'src/fonts',                 // optional dir, copied to <outdir>/<basename>
  },
  output: { html: 'dist/book.html', pdf: 'dist/book.pdf' },   // both required
  metadata: {                            // → PDF metadata + template context
    title: 'Untitled Book', author: 'Unknown Author', subject: '', keywords: [], lang: 'en',
  },
  page: {                                // → injected @page ONLY if styles.css has none
    size: 'A4',                          // e.g. '4.25in 5.5in'
    margins: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm', inside: '2cm', outside: '2cm' },
  },                                     // inside/outside both set → margin-inside/outside, else left/right
  prince: { javascript: false, verbose: false, options: [], executablePath: 'prince' },
  devServer: { port: 3000, host: 'localhost', open: true },
  data: { name: './path.csv' },          // .csv (Papa), .json, .yaml/.yml → data.name
  helpers: 'src/templates/helpers.js',   // a PATH to a module; default export = { name(...) {} }
  markdown: { gfm: true, breaks: false, extensions: [] },  // extensions: paths exporting a MarkedExtension
});
```

All paths resolve against the config file's directory, so a build behaves the same from anywhere. Missing `input.*` / `output.*` throws a "Configuration error".

## Build pipeline (`src/core/builder.ts`)

1. Glob `input.content`, parse each file with gray-matter, validate frontmatter, render with marked, sort.
2. Load `data` sources, partials and assets in parallel.
3. Render `input.template` with the context below.
4. Write `output.html`. Write `<outdir>/styles.css`: the source stylesheet, with the generated `@page` prepended **only if** `/@page\s*\{/` does not match it (`builder.ts:121`). The template must link `styles.css` by that name.
5. Copy assets into `<outdir>` (= `dirname(output.html)`):
   - every `**/*.{png,jpg,jpeg,gif,svg,webp,ico,woff,woff2,ttf,otf,eot}` under the content directory and under the template directory, at the same relative path — so `![](figures/a.png)` beside a content file keeps working;
   - `input.assets` → `<outdir>/<basename(assets)>` (`src/fonts` → `dist/fonts`, `public` → `dist/public`, `src/pieces` → `dist/pieces`);
   - a bare `assets/` at the project root → `<outdir>/assets` (legacy).
6. Run Prince: `prince <html> -o <pdf> [--javascript] [--verbose] --pdf-title … --pdf-author … --pdf-subject … --pdf-keywords a, b [...prince.options]` (`src/core/prince.ts:91-101`). `prince.options` is where `--fileroot=/abs/dir` goes when images live outside the project.

## Content files (`src/core/markdown.ts`, `src/core/utils.ts`)

Frontmatter is YAML. Known fields and how they're checked (`validateFrontmatter`):

| field | rule |
|---|---|
| `order` | must be a number, else **ignored with a warning** |
| `title` | coerced to string |
| `subtitle`, `author`, `id` | strings, passed through |
| `tags` | must be an array, else ignored |
| anything else | passes through untouched — `template`, `class`, `section`, `number`, `perPage` are book conventions, not crown's |

Sorting (`sortByOrder`): by `order` when both have one; files with `order` before files without; the rest by path. A file with no frontmatter at all is fine.

Markdown: marked with GFM on, `breaks` off, **no smart quotes** — write real `“ ” ’ —` in the source. Raw HTML passes through, which is how covers, epigraphs and `<aside>`s are written.

Each entry in `content` is a `ContentFile`:

```
{ path, absolutePath, frontmatter, html, raw }
```

## Template context (`src/types/content.ts`, `src/core/template.ts`)

| key | value |
|---|---|
| `content` | the sorted `ContentFile[]` (`chapters` is a legacy alias of the same array) |
| `metadata` | from config, defaults applied |
| `data` | one key per `data` source |
| `generatedDate` | a `Date`; honours `SOURCE_DATE_EPOCH` for reproducible builds |

Partials: every `partials/**/*.{html,hbs}` beside the layout is registered under its **basename without extension** — nested folders flatten, so names must be unique. Call with `{{> chapter this}}`; inside the partial `this` is the `ContentFile`, so `{{frontmatter.title}}` and `{{{html}}}` (triple braces — it's already HTML).

Built-in helpers: `markdown` (inline render), `json`, `formatDate date ["iso"]`, `eq`, `gt`, `lt`, `gte`, `lte`, `length`, `join array sep`. Subexpressions work: `{{#each (chunk @root.data.pieces frontmatter.perPage) as |page|}}`.

The dispatch idiom every book uses:

```handlebars
{{#each content}}
  {{#if (eq frontmatter.template "cover")}}{{> cover this}}
  {{else if (eq frontmatter.template "back-cover")}}{{> back-cover this}}
  {{else}}{{> chapter this}}{{/if}}
{{/each}}
```

## Dev server (`src/dev/`)

Vite serves `preview.html` with the PDF in an iframe and reloads it over a WebSocket. chokidar watches the content, template and styles directories plus the config, debounced 300 ms: `.md` / `.html` / `.hbs` / `.css` / `.scss` trigger a rebuild (Sass is **not** compiled); a config change prints a message to restart. A change during a build queues one trailing rebuild.

## `crown layout` (`src/core/imposition.ts`, `src/cli/commands/layout.ts`)

Pure pdf-lib; needs no Prince. A sheet is tiled into cells, one finished page each; two horizontally adjacent cells form a **folio** (a fold between them, 4 pages once printed both sides). Folios are cut apart, nested and stapled through the fold.

| `--format` | grid | page on letter | pages/sheet |
|---|---|---|---|
| `half` | 2 × 1 | 5.5 × 8.5 | 4 |
| `quarter-portrait` (default) | 2 × 2 | 4.25 × 5.5 | 8 |
| `quarter-landscape` | 2 × 2 | 5.5 × 4.25 | 8 |
| `sixth` | 2 × 3 | 4.25 × 3.67 | 12 |
| `eighth-landscape` | 2 × 4 | 4.25 × 2.75 | 16 |
| `eighth-portrait` | 4 × 2 | 2.75 × 4.25 | 16 |
| `quarter-strip` | 4 × 1 (landscape sheet) | 2.75 × 8.5 | 8 |
| `magic` | 4 × 2 | 2.75 × 4.25 | 8, one side |

Sheets: `letter` `legal` `tabloid` `a4` `a3` — formats are named by grid, so `-f quarter-portrait -s tabloid` gives 5.5 × 8.5 pages.

Kinds (`-i`): `zine` nests every folio into one saddle-stitched book (default); `cover` imposes a 4-page wrap and repeats it to fill the sheet; `magic` is the one-sheet eight-pager, top row rotated 180°.

Behaviour worth knowing:
- Output name defaults to `<input>.<format>-<kind>.pdf` beside the input. `-o` is a file, or a directory when it has no extension / exists as a directory / there are several inputs.
- A zine that isn't a multiple of 4 is **padded with blank cells after the last page** (warning printed). `--signature N` (multiple of 4) splits a thick book into nested signatures.
- Pages that don't match the cell are scaled to fit, never distorted.
- Duplex: a vertical fold needs the back mirrored left-to-right — the **long** edge on a portrait sheet, **short** on landscape. The command prints which. `--duplex long|short` mirrors the backs in software when the printer flips the other way.
- Saddle-stitch invariant: folio *k* carries `last−2(k−1)` and `first+2(k−1)` on its front; each folio's four pages sum to `2 × (first + last)`. Verify a change by imposing a numbered dummy and reading the numbers.
