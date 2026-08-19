# Upstream & how to update

This skill vendors Oskar Wickström's **The Proportional Web** (v0.1.0). Nothing is fetched at runtime.

## Sources

| What | Upstream path | Vendored as |
|---|---|---|
| Bundled stylesheet | `index.css` | `assets/the-proportional-web/index.css` (byte-for-byte) |
| Minified stylesheet | `index.min.css` | `assets/the-proportional-web/index.min.css` (byte-for-byte) |
| Aside-anchoring script | `index.js` | `assets/the-proportional-web/index.js` (byte-for-byte) |
| Pandoc template | `src/demo/template.html` | `assets/pandoc-template.html` (byte-for-byte) |
| The document itself (Pandoc Markdown source) | `src/demo/index.md` | `reference/index.md` (byte-for-byte) |
| License | `LICENSE.md` (MIT, © 2026 Oskar Wickström) | Notice reproduced below |

Repo: https://github.com/owickstrom/the-proportional-web · Rendered: https://owickstrom.github.io/the-proportional-web/

Authored here, not upstream: `SKILL.md`, `reference/markup.md` (markup contract derived from the CSS), `assets/starter.html` (plain-HTML skeleton), this file.

This repo is MIT (root `LICENSE`). The upstream notice is retained below because MIT requires it to accompany copies; the vendored `index.css`/`index.min.css`/`index.js` also carry it in their file headers — keep those headers when copying the directory into a project.

### Third-party notice — `assets/the-proportional-web/*`, `assets/pandoc-template.html`, `reference/index.md`

> Copyright 2026 Oskar Wickström
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Pinned version (last vendored 2026-08-18)

- `owickstrom/the-proportional-web` @ `f29ff5721a3a3f63d5bcb7918c3ef2838bedc797` (package.json version `0.1.0`)
- sha256:
  - `assets/the-proportional-web/index.css` `3c6e730ed44836cd79fcb96c44ad6d26351b41b256063fe118a0bfea221366f2`
  - `assets/the-proportional-web/index.min.css` `433e7a744ab7972a162d0de755eb63dedd9458a0c68550ba5bf876ca3456f889`
  - `assets/the-proportional-web/index.js` `837a69ac96265376eec6036f9777594e95ec9baf7d8ec43c44cd5958a4c87a4b`
  - `assets/pandoc-template.html` `296832fd898402b82555f979b97194210dbbbfcff792bd06e59bc601c4f30203`
  - `reference/index.md` `9579141631396db2d43a27134e5c60f17b71fb798410f200f04ef462d825a27a`

## To update

Run from this directory:

```sh
B=https://raw.githubusercontent.com/owickstrom/the-proportional-web/main

# 1. What changed upstream?
for pair in \
  "index.css:assets/the-proportional-web/index.css" \
  "index.min.css:assets/the-proportional-web/index.min.css" \
  "index.js:assets/the-proportional-web/index.js" \
  "src/demo/template.html:assets/pandoc-template.html" \
  "src/demo/index.md:reference/index.md"; do
  up=${pair%%:*}; local=${pair#*:}
  curl -sL "$B/$up" | diff -q "$local" - >/dev/null && echo "unchanged  $local" || echo "CHANGED    $local  (upstream $up)"
done

# 2. Pull whatever changed (or all of them)
curl -sL -o assets/the-proportional-web/index.css     "$B/index.css"
curl -sL -o assets/the-proportional-web/index.min.css "$B/index.min.css"
curl -sL -o assets/the-proportional-web/index.js      "$B/index.js"
curl -sL -o assets/pandoc-template.html               "$B/src/demo/template.html"
curl -sL -o reference/index.md                        "$B/src/demo/index.md"
curl -sL "$B/LICENSE.md" | head -1     # still "Copyright … Oskar Wickström" / MIT?

# 3. Re-pin
curl -sL "https://api.github.com/repos/owickstrom/the-proportional-web/commits?per_page=1" | grep -m1 '"sha"'
curl -sL "$B/package.json" | grep '"version"'
shasum -a 256 assets/the-proportional-web/* assets/pandoc-template.html reference/index.md
```

Then update **Pinned version** above, and — this is the part that matters — **re-read the diff of `index.css` and reconcile `reference/markup.md` and `assets/starter.html`** with any new/renamed selectors, variables, or breakpoints. Those two files are hand-derived from the CSS and won't update themselves. Open `assets/starter.html` in a browser afterwards to eyeball it.

Never hand-edit the vendored files; keep them clean mirrors so step 1 stays meaningful. Local overrides belong in a project stylesheet, per `SKILL.md`.
