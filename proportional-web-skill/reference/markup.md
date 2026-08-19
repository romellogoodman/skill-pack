# The Proportional Web — markup contract

What the vendored stylesheet (`assets/the-proportional-web/index.css`) expects, derived from its selectors. Follow this and the page comes out looking like https://owickstrom.github.io/the-proportional-web/. For the author's reasoning, read `index.md` in this directory.

## The system at a glance

| Thing | Value | Where |
|---|---|---|
| Body face | Alegreya (variable 400–900), weight 450 | `--font-family`, `--font-weight-normal` |
| Display / small-caps face | Alegreya SC | `header h1`, `body h1`, `h2`, `th`, `abbr`, `.author`, `.canonical-name` |
| Code face | Courier Prime | `--font-family-code` |
| Root size | 16px; 14px at ≤ 480px | `:root`, media query |
| Size scale | ¾, ⅞, 1, 1⅛, 1¼, 1⅜, 1½, 2, 2½, 3, 4 rem (12–64px) | `index.md` § "sizing system" |
| Line height | 1.2rem — every vertical measure is a multiple of it | `--line-height` |
| Rhythm engine | `* + * { margin-top: var(--line-height) }` (the "owl" selector); elements opt out locally | `base.css` |
| Measure | 66ch inner + 3ch margin each side | `--body-inner-width`, `--horizontal-margin` |
| Body text | justified, `hyphens: auto`, `text-wrap: pretty`, `hyphenate-limit-chars: 3`, oldstyle numerals (`onum`) | `p`, `:root` |
| Paragraphs | first after a heading/hr is flush; each following `p` is indented 3ch with no gap | `p + p`, `h* + p` |
| Color | `#000` on `#fff`, nothing else | `--text-color`, `--background-color` |
| Rules | 1.5px | `--border-thickness` |
| Ornament | ❧ U+2767 Rotated Floral Heart Bullet | `hr:after`, `aside:before` |
| Layout | body left-aligned until 112ch, then centered; asides go to the right margin at ≥ 95ch | `layout.css`, `asides.css` |

Fonts load via `@import` from Google Fonts at the top of `index.css`. To go fully offline, self-host Alegreya, Alegreya SC, and Courier Prime (all SIL OFL) and replace that `@import` line.

## Page skeleton

```html
<!DOCTYPE html>
<html lang="en">                     <!-- lang is REQUIRED: hyphens:auto does nothing without it -->
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
  <title>…</title>
  <link rel="stylesheet" href="the-proportional-web/index.min.css" />
  <script src="the-proportional-web/index.js"></script>
</head>
<body>
  <header>…</header>
  <nav id="TOC" role="doc-toc">…</nav>   <!-- optional -->
  <h1>…</h1> <p>…</p> …                   <!-- chapters flow directly in body -->
  <footer>Copyright …</footer>
</body>
</html>
```

`index.js` only does one thing: on load, it gives every `<aside>` an anchor to its previous sibling so the margin note lines up with the paragraph it belongs to. Omit it and asides still render, just not vertically aligned to their paragraph on wide screens.

## Elements

### Title block
```html
<header>
  <h1 class="title">The Proportional Web</h1>
  <p class="subtitle">Inspired by <em>The Elements of Typographic Style</em></p>
  <p>Authored by <cite>Oskar Wickström</cite>. <span class="version">v0.1.0</span>, licensed under <abbr>MIT</abbr>.</p>
</header>
```
`header h1` is 2.5rem all-small-caps with no rule under it (unlike chapter `h1`s). `header p` is left-aligned, not indented.

### Headings — three levels, and they're `h1`/`h2`/`h3`
The stylesheet is written for Pandoc output, where **chapters are `h1`, sections `h2`, sub-sections `h3`** (the author notes this is semantically off; see "Adaptations" to fix it).

```html
<h1><span class="header-section-number">1</span> On the theory of war</h1>          <!-- number hidden by CSS -->
<h2><span class="header-section-number">1.2</span> Art or science of war</h2>       <!-- shown, ½ch gap -->
<h3><span class="header-section-number">1.2.1</span> Usage still unsettled</h3>
```
- `body h1`: 1.25rem uppercase titling-caps, letter-spaced 0.15em, 1.5px rule beneath, two lines of space above.
- `h2`: 1.25rem all-small-caps, letter-spaced 0.125em.
- `h3`: italic body size.
- `h4`–`h6`: unstyled beyond weight/margins — the system deliberately stops at three levels.
- The number spans are optional. If you use them, put them on `h2`/`h3` only (they're `display:none` inside `h1`).

### Table of contents
```html
<nav id="TOC" role="doc-toc">
  <h2 id="toc-title">Contents</h2>
  <ul>
    <li><a href="#foundations"><span class="toc-section-number">1</span> Foundations</a>
      <ul>
        <li><a href="#typography"><span class="toc-section-number">1.1</span> Typography</a></li>
      </ul>
    </li>
  </ul>
</nav>
```
`#TOC a` is `display:block; height: var(--line-height)` — one entry per line, no bullets, underline only on hover. `h2#toc-title` is styled like a chapter `h1`.

### Paragraphs & inline
- `<p>` — justified, hyphenated. Consecutive `<p>`s indent 3ch with **no** vertical gap; a `<p>` directly after `h1`–`h4` or `hr` is flush. Don't add blank-line spacing between paragraphs; that's the point.
- Use `&shy;` (soft hyphen) inside long words the hyphenator handles badly.
- `<em>` italic · `<strong>` weight 800 · `<sub>` sized ¾ and kept on the baseline grid.
- `<abbr>HTML</abbr>` — renders as small caps (that's how acronyms get typeset; write them in normal caps and let CSS handle it).
- `<span class="canonical-name">Alegreya</span>` — small caps for proper nouns, product names, titles of works you want to distinguish. Upstream Pandoc source writes this as `[Alegreya]{.canonical-name}`.
- `<a>` — text-colored, underlined at 1.5px. No hover color; the design is monochrome.
- Numerals are oldstyle by default. For columns of figures use `style="font-variant-numeric: lining-nums tabular-nums"` (or a class) so they align.

### Asides (margin notes)
Place the `<aside>` **immediately after the paragraph it comments on** — the JS anchors it to `previousElementSibling`.
```html
<p>…the paragraph being annotated…</p>
<aside>Side note in 0.875rem, ragged right.</aside>
<p>…next paragraph continues, indented, with no extra gap…</p>
```
- ≥ 95ch viewport: absolutely positioned in the right margin, 20ch wide, top aligned to the paragraph via CSS anchor positioning.
- Narrower: rendered inline as a small paragraph prefixed with ❧.
- `p + aside + p` gets `margin-top:0; text-indent:3ch` so the flow reads as if the aside weren't there.
- Because the aside is placed *after* its paragraph, don't put an aside between a heading and its first paragraph.

### Blockquotes
```html
<blockquote>
  <p>Je n’ai fait celle-ci plus longue que parce que je n’ai pas eu le loisir de la faire plus courte.</p>
  <footer>
    <span class="author">Blaise Pascal</span>,
    <cite>Lettres Provinciales</cite>, letter XVI,
    <span class="year">1657</span>
  </footer>
</blockquote>
```
- Indented 3ch on both sides. **Curly quotes are inserted by CSS** (`“` before the first `<p>`, `”` after the last) — do not type them yourself.
- `.author` → small caps · `<cite>` → italic · `.year` → its own line. Keep the trailing commas as text nodes; the footer is not a flex row.

### Figures
```html
<figure>
  <img src="vitruvian-man.jpg" width="435" height="600" alt="Leonardo’s Vitruvian Man" />
  <figcaption>
    <span class="author">Leonardo Da Vinci</span>,
    <cite>Vitruvian Man</cite>,
    <span>c. 1490, pen and watercolor over metalpoint on paper</span>
  </figcaption>
</figure>
```
- Indented 3ch, two lines of space above/below, horizontal overflow scrolls. `img`/`video` are `display:block; width:100%`.
- Same `.author` / `<cite>` styling as blockquote footers.
- `<figure><pre>…</pre></figure>` and `<figure><table>…</table></figure>` also work (margins zeroed inside).
- `figure.example` in the upstream demo is demo-only CSS; don't rely on it.

### Lists
Plain `<ul>` / `<ol>`; nesting supported. Bullets are `•` via `::before`; ordered lists count as `1.`, `1.1.`, `1.1.1.` (nested `counters()`), so **don't set `start` or `type`** — they'd be ignored. Nested lists indent 2ch.

### Tables
```html
<table>
  <thead><tr><th>Name</th><th>Dimensions</th><th>Position</th></tr></thead>
  <tbody><tr><td>Boboli Obelisk</td><td>1.41m × 1.41m × 4.87m</td><td>43°45′50.78″N …</td></tr></tbody>
</table>
```
Full width; small-caps `th` with a 1.5px rule under the last head row; otherwise borderless — spacing does the work. Wrap in `<figure>` if you want it indented like other block elements. Use `&times;`, `&prime;`, `&Prime;` not `x` `'` `"`.

### Code
`<pre><code>…</code></pre>` and inline `<code>` in Courier Prime; `pre` **wraps** (`pre-wrap` + `break-all`) rather than scrolling. Inline code is 0.95em with tightened tracking. There is no syntax highlighting; the design is for prose. If you must highlight, keep it monochrome (weight/italic), not color.

### Horizontal rule
`<hr />` → a 1.5px rule with ❧ centered on it, knocked out on the page background. Use it as a section ornament / scene break, not as a layout divider.

### Details
```html
<details><summary>License</summary><p>…</p></details>
```
Ruled top and bottom, italic summary, `»` marker that rotates 90° when open. Paragraphs inside behave like body paragraphs (first flush, following ones indented).

### Footer
A bare `<footer>` at the end of `<body>` for the copyright line — no special styling beyond rhythm.

## Not covered by the stylesheet
No styles for `nav` (other than `#TOC`), forms, buttons, cards, grids, dark mode, or color of any kind. The author is explicit: **prose documents only** — books, journals, blogs, manuals, wikis. Don't reach for this on an app UI.

## Adaptations (do these in a *separate* stylesheet loaded after `index.css`; never edit the vendored file)

**Change the measure, rhythm, or face** — override the custom properties on `:root`:
```css
:root { --body-inner-width: 60ch; --line-height: 1.25rem; --font-family: "Crimson Pro", serif; }
```
Keep every vertical size a multiple of `--line-height` or the baseline grid drifts.

**Ragged-right instead of justified** (if you see rivers):
```css
p { text-align: left; }
```

**Semantic heading levels** (title `h1`, chapters `h2`, sections `h3`, sub-sections `h4`) — shift each heading ruleset down one level. Copy the *complete* `body h1` declaration block onto `h2`, the complete `h2` block onto `h3`, and the `h3` block onto `h4` (a later stylesheet only overrides the properties it names, so partial copies leave stray small-caps/letter-spacing behind). Then hide the number span on `h2` instead of `h1` if you use numbers. Only do this if the multiple-`h1` structure is a real problem for you; the upstream page ships as-is.

**Dark mode** — the author deliberately ships black-on-white only. If you add it, flip the two color tokens and nothing else:
```css
@media (prefers-color-scheme: dark) { :root { --text-color: #fff; --background-color: #000; } }
```

**Single-file / artifact use** — inline `index.css` into a `<style>` and `index.js` into a `<script>`; the Google Fonts `@import` stays as-is (or swap for a `<link rel="stylesheet" href="https://fonts.googleapis.com/…">`).
