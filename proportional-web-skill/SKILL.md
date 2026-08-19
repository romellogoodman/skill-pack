---
name: proportional-web
description: Typeset a prose document — essay, blog post, article, manual, book chapter, report, wiki page — as an HTML page in the style of Oskar Wickström's The Proportional Web, a Bringhurst-derived print-typography stylesheet (Alegreya, justified & hyphenated text, 3ch paragraph indents, 1.2rem baseline rhythm, small-caps names, margin asides, black on white). Vendored MIT CSS/JS; no network needed. Use when the user wants a page set "like a book", "like Bringhurst / Elements of Typographic Style", "The Proportional Web", "the variable-width Monospace Web", or a classic literary look for prose-heavy HTML or Pandoc output.
allowed-tools: Read Write Edit Glob Grep Bash(ls *) Bash(cp *) Bash(mkdir *) Bash(cat *) Bash(pandoc *) Bash(open *) Artifact
---

# The Proportional Web

Typeset prose for the web the way Robert Bringhurst typesets it for print, using Oskar Wickström's stylesheet — the "spiritual and variable-width sequel" to The Monospace Web. Everything this skill needs ships in this directory:

```
assets/the-proportional-web/   index.css · index.min.css · index.js   ← upstream, verbatim; copy into the project
assets/starter.html            plain-HTML skeleton using every convention (open it to preview)
assets/pandoc-template.html    upstream's Pandoc template, verbatim
reference/markup.md            the markup contract: which elements/classes do what, gotchas, adaptations
reference/index.md             upstream's own document, verbatim — the author's reasoning
UPSTREAM.md                    provenance, pins, how to pull updates from GitHub
```

## When to use it — and when not to

**Yes:** documents that are mostly paragraphs. Essays, blog posts, long-form articles, manuals, RFC-style specs, book chapters, reports, personal sites, wikis. Anything you'd happily read printed.

**No:** app UI, dashboards, marketing pages, anything with forms, buttons, cards, or color-coded state. The stylesheet has no styles for those and the author is explicit that it isn't for dynamic web applications. Say so and suggest something else rather than bending it.

## Steps

1. **Read `reference/markup.md`.** It's short and it is the contract — headings are `h1`/`h2`/`h3` for chapter/section/sub-section, asides go *after* their paragraph, blockquotes get their quote marks from CSS, `lang` is required for hyphenation, and so on. Skim `reference/index.md` if you want the author's rationale for a choice.

2. **Install the stylesheet into the project.** Copy the directory as upstream's own instructions expect:
   ```sh
   cp -r <this-skill-dir>/assets/the-proportional-web <project>/the-proportional-web
   ```
   Then in `<head>`:
   ```html
   <link rel="stylesheet" href="the-proportional-web/index.min.css" />
   <script src="the-proportional-web/index.js"></script>
   ```
   Never edit the vendored files. Project-specific overrides go in a separate stylesheet loaded after `index.min.css` (see "Adaptations" in `markup.md`).

3. **Write the page.**
   - **From scratch or from prose the user gives you:** start from `assets/starter.html`, keep its `<head>` and `<header>`/`<nav id="TOC">` structure, and pour the content in using the element conventions. Use `<abbr>` for acronyms, `.canonical-name` for names you want in small caps, `<aside>` for side notes, `<blockquote>` + `<footer>` for attributed quotes, `<figure>` + `<figcaption>` for images/tables/code with captions, `<hr>` for ornamental breaks. Consecutive paragraphs are plain `<p>`s — no spacer elements, no `<br>`, no manual indents.
   - **From Markdown via Pandoc** (the author's own pipeline):
     ```sh
     pandoc --toc --toc-depth=2 -s --number-sections --number-offset=0 \
       --css the-proportional-web/index.min.css \
       -V 'header-includes=<script src="the-proportional-web/index.js"></script>' \
       --no-highlight -i input.md -o output.html
     ```
     Pandoc emits exactly the markup the CSS expects (`.header-section-number`, `#TOC`, `.toc-section-number`). Use `assets/pandoc-template.html` with `--template` if you want the header block and no default Pandoc CSS. In Markdown, `[Name]{.canonical-name}` and raw `<aside>`/`<abbr>` HTML pass through.
   - **Single-file page or Artifact:** inline `index.css` into a `<style>` and `index.js` into a `<script>`; the Google Fonts `@import` at the top of the CSS keeps working (artifacts allow that host).

4. **Check it.** Open the result in a browser at a wide (≥ 1300px) and a narrow (≤ 480px) width. Wide: asides sit in the right margin aligned to their paragraph, body is centered. Narrow: root drops to 14px, asides collapse inline with ❧. Look for justification rivers — if a passage is bad, add `&shy;` to the offending words, or fall back to `p { text-align: left }` in your override sheet. Confirm `<html lang="…">` is set, or nothing hyphenates.

5. **Attribute.** The CSS/JS headers already carry the author's MIT notice; keep them. If the page has a colophon or footer, a line like "Typeset with The Proportional Web by Oskar Wickström" is the courteous thing to do (the author asks: "don't forget proper attribution").

## Notes

- Fonts (Alegreya, Alegreya SC, Courier Prime — all SIL OFL) load from Google Fonts via `@import` in `index.css`. The *skill* is offline; the *page* fetches ~170 kB of fonts. To make the page offline too, self-host them and replace that one `@import` line in an override.
- Colors are `--text-color: #000` / `--background-color: #fff` and nothing else. If asked for dark mode, flip only those two tokens under `prefers-color-scheme: dark`; don't introduce accent colors — that's the design.
- If `$ARGUMENTS` names a file (`.md` or `.html`), treat it as the source to typeset. If it names a directory, look for the project's existing prose (README, docs, posts) and ask what to typeset if unclear.
- To review an existing page for conformance rather than build one, read `reference/markup.md` and check the page against it; report `file:line` findings.
