# Palettes

Seven complete looks. **Pick one per explainer and commit to it** — including the type pairing and the character notes, which are what actually separate them. Rotate: if the last explainer was Paper & Ink, don't reach for it again. Deriving a seventh from the subject matter is better than any of these; these exist so the default is never "the same page in a different color."

Each block drops into `App.scss` (proto mode) or the page `<style>` (single-file mode). Every palette defines the same token names, so `explainer-kit.scss` / `explainer-kit.html` inherit whichever you choose without edits.

**Non-negotiables regardless of palette**

- Body text against `--color-bg` must clear 4.5:1. Every palette below does; verify again if you touch a value.
- Never carry meaning in hue alone — the quiz already pairs color with ✓/✗ glyphs. Keep that if you restyle.
- **Verify the typeface actually resolves — don't trust the stack.** A missing family fails silently to the
  next entry, so a page can render in a default face while the CSS claims otherwise. Measure before committing:

  ```js
  const c = document.createElement("canvas").getContext("2d");
  const w = (f) => { c.font = `48px ${f}`; return c.measureText("Hamburgefonstiv 123").width; };
  w('"Avenir Next", serif') !== w("serif"); // true = the family is really there
  ```

  Compare each candidate against the *same generic* it falls back to (serif vs serif, mono vs mono — a mono
  candidate measured against `monospace` is inconclusive, since both share metrics). Checked on macOS/Chrome:
  `Iowan Old Style`, `Charter`, `Hoefler Text`, `Palatino`, `Avenir Next`, `Optima`, `Futura` and `Gill Sans`
  are present, while `ui-serif`, `New York`, `Courier Prime`, `JetBrains Mono` and `SF Pro Text` silently fall
  back. Webfont CDNs are blocked outright in artifacts, so system stacks are the only reliable route.
- Dark mode is not optional. Each block ships both; put the light tokens on bare `:root` and the dark ones inside `@media (prefers-color-scheme: dark)`.
- **Publishing as an artifact needs three states, not two.** The viewer's default is "system", which stamps nothing on the root — so define the full light palette on bare `:root`, redefine the tokens under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }`, and redefine them again under `:root[data-theme="dark"]`. A color whose only definition sits inside a media or `[data-theme]` block never applies in the unstamped state, which is the classic unreadable-artifact bug.

---

## 1. Paper & Ink

Warm editorial. Reads like a well-set essay. Best for conceptual explainers where prose carries the weight.

```scss
:root {
  --color-bg: #fbf9f5;
  --color-surface: #f4f1ea;
  --color-text: #1a1c1f;
  --color-text-light: #62656b;
  --color-border: #ddd8cd;
  --color-accent: #2f5d50;
  --color-ok: #1d7a52;
  --color-bad: #b03a2b;
  --radius: 8px;
  --font-display: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
  --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #15171a;
    --color-surface: #1e2126;
    --color-text: #eceae4;
    --color-text-light: #9ca0a8;
    --color-border: #32363d;
    --color-accent: #7fc4ab;
    --color-ok: #66c99a;
    --color-bad: #f08a76;
  }
}
```

Character: serif display at 1.05 line-height with `letter-spacing: -0.02em`, italic accent phrases, thin rules between sections.

---

## 2. Blueprint

Cool and technical, drafting-table lineage. Best for systems, protocols, architecture.

```scss
:root {
  --color-bg: #f2f5f9;
  --color-surface: #e6ecf4;
  --color-text: #101827;
  --color-text-light: #5a6884;
  --color-border: #c7d3e3;
  --color-accent: #1d4ed8;
  --color-ok: #0f766e;
  --color-bad: #be123c;
  --radius: 3px;
  --font-display: "SF Mono", ui-monospace, Menlo, monospace;
  --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0b1220;
    --color-surface: #131c2e;
    --color-text: #e2e8f4;
    --color-text-light: #94a3c0;
    --color-border: #26334d;
    --color-accent: #7aa2ff;
    --color-ok: #43c9b0;
    --color-bad: #ff7d95;
  }
}
```

Character: tight radii, monospace headings, uppercase eyebrows with wide tracking, 1px hairlines everywhere. Consider a faint grid background: `background-image: linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px); background-size: 24px 24px;` at low opacity.

---

## 3. Terminal

Dark-native, phosphor. Best for anything about computation, debugging, or state machines.

```scss
:root {
  --color-bg: #0d0f0e;
  --color-surface: #161a18;
  --color-text: #d8e6dc;
  --color-text-light: #7e948a;
  --color-border: #26302b;
  --color-accent: #4ade80;
  --color-ok: #4ade80;
  --color-bad: #fb7185;
  --radius: 2px;
  --font-display: ui-monospace, "SF Mono", Menlo, monospace;
  --font-body: ui-monospace, "SF Mono", Menlo, monospace;
}
@media (prefers-color-scheme: light) {
  :root {
    --color-bg: #f7f8f7;
    --color-surface: #eceeed;
    --color-text: #10120f;
    --color-text-light: #5b665e;
    --color-border: #d2d8d4;
    --color-accent: #15803d;
    --color-ok: #15803d;
    --color-bad: #be123c;
  }
}
```

Character: monospace throughout, `text-transform: uppercase` on labels, blocky fills instead of rounded bars, an optional blinking caret on the active step. This is the one palette that is dark-first — note the inverted media query.

---

## 4. Risograph

Cream stock, two hot inks, deliberate overprint. Best for playful or counterintuitive topics where the page should feel like a zine.

```scss
:root {
  --color-bg: #fffdf3;
  --color-surface: #fff6e0;
  --color-text: #1b1a17;
  --color-text-light: #6a6558;
  --color-border: #e8dcbf;
  --color-accent: #ff4b7d;
  --color-accent-2: #2b58ff;
  --color-ok: #1f7a4c;
  --color-bad: #d92b4b;
  --radius: 0;
  --font-display: "Futura", "Avenir Next", "Century Gothic", sans-serif;
  --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #17161b;
    --color-surface: #211f27;
    --color-text: #f7f3e8;
    --color-text-light: #a8a294;
    --color-border: #363340;
    --color-accent: #ff7aa0;
    --color-accent-2: #7f95ff;
  }
}
```

Character: square corners, heavy display weight, `mix-blend-mode: multiply` on overlapping shapes, the second ink used for the interactive layer only. Offset shadows (`box-shadow: 4px 4px 0 var(--color-accent-2)`) instead of blurs.

---

## 5. Clay

Earthy, low-contrast warmth. Best for human-scale subjects — process, teams, learning itself.

```scss
:root {
  --color-bg: #f6f1ea;
  --color-surface: #ede4d8;
  --color-text: #2a211c;
  --color-text-light: #6f6157;
  --color-border: #ddcfc0;
  --color-accent: #b4552d;
  --color-ok: #5c7a3f;
  --color-bad: #a13a2c;
  --radius: 14px;
  --font-display: "Charter", "Bitstream Charter", Georgia, serif;
  --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #1c1815;
    --color-surface: #262019;
    --color-text: #f0e7dc;
    --color-text-light: #a89685;
    --color-border: #3a3129;
    --color-accent: #e08b5f;
    --color-ok: #9ab873;
    --color-bad: #e08272;
  }
}
```

Character: generous radii, soft one-directional shadows, rounded bar caps, nothing sharp. Slightly larger body size (1.06rem) and looser leading.

---

## 6. Newsprint

Near-monochrome brutalist with a single red. Best when the argument is the design — comparisons, myth-busting, strong claims.

```scss
:root {
  --color-bg: #ffffff;
  --color-surface: #f0f0f0;
  --color-text: #000000;
  --color-text-light: #565656;
  --color-border: #000000;
  --color-accent: #e5322d;
  --color-ok: #10745a;
  --color-bad: #e5322d;
  --radius: 0;
  --font-display: "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-body: "Helvetica Neue", Helvetica, Arial, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0a0a0a;
    --color-surface: #171717;
    --color-text: #fafafa;
    --color-text-light: #a3a3a3;
    --color-border: #fafafa;
    --color-accent: #ff5a55;
    --color-ok: #4ec9a0;
    --color-bad: #ff5a55;
  }
}
```

Character: hard 1–2px black borders, zero radius, no shadows at all, very large tight display type (`font-size: clamp(2.6rem, 9vw, 5rem); letter-spacing: -0.04em`), rules doing the work that boxes do elsewhere.

---

## 7. Quarto

Set like a book chapter rather than a UI: the page is monochrome, and the only color anywhere is inside the
figures, where it encodes data. Best for explainers that argue in prose and use two or three figures to prove
the point. This is a **layout stance as much as a palette** — take the structure with it or it won't read.

```scss
:root {
  --color-bg: #fbfaf7;
  --color-surface: #f2efe8;
  --color-text: #14120f;
  --color-text-light: #5d584e;
  --color-border: #d9d4c8;
  --color-accent: #14120f; // the page has no accent; ink is the accent
  --data-a: #c2183f; // first series
  --data-b: #1a3fb8; // second series
  --color-ok: #1d6b3f;
  --color-bad: #a3182f;
  --radius: 0;
  /* Three voices: serif reads, sans labels, mono counts. */
  --font-body: "Iowan Old Style", Charter, Palatino, "Hoefler Text", Georgia, serif;
  --font-display: "Iowan Old Style", Charter, Palatino, Georgia, serif;
  --font-furniture: "Avenir Next", Avenir, "Helvetica Neue", system-ui, sans-serif;
  --font-data: ui-monospace, "SF Mono", Menlo, Monaco, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #131211;
    --color-surface: #1c1a18;
    --color-text: #ece7dc;
    --color-text-light: #9c968a;
    --color-border: #34312c;
    --color-accent: #ece7dc;
    --data-a: #ff6f8d;
    --data-b: #8ba4ff;
  }
}
```

Character — these are the load-bearing parts:

- **Three type voices, not one.** All-serif reads flat. Serif carries the prose; a sans carries every piece of
  furniture (running head, section numerals, figure labels, dial labels, legends, buttons) in uppercase at
  ~0.66–0.7rem with `letter-spacing: 0.11em` and weight 600; mono carries code identifiers and live numbers with
  `font-variant-numeric: tabular-nums`. Set the prose itself in `oldstyle-nums` so figures sit in the line.
- **A baseline unit.** Set `--lh: 1.5rem` and make every vertical margin a multiple of it.
- **Marginalia.** A `[text] [note]` grid; short asides sit in the right margin beside the paragraph they gloss,
  and collapse inline below ~62rem. Drop the margin column entirely at narrow widths — a reserved-but-empty
  column reads as a broken layout.
- **Small caps** for headings (`font-variant: small-caps; letter-spacing: 0.04em`), with roman or lowercase-roman
  section numerals in the mono face.
- **Indented paragraphs**, not blank lines: `p + p { text-indent: 3ch }`, `margin: 0`.
- **Justified prose** with `hyphens: auto`, reverting to left-aligned on narrow screens.
- **Numbered plates.** Each interactive is a `<figure>` with a caption reading `Fig. 1 — Title.` followed by the
  live readout, so the widget is furniture in an argument rather than an app control.

Skip the drop caps, floral dinkuses and full scholarly apparatus. The target is a well-set chapter, not a pastiche
of one.

---

## Picking one

Match the palette to the subject rather than cycling blindly:

| Subject | Reach for |
| --- | --- |
| Conceptual, prose-led | Paper & Ink, Clay |
| Systems, networks, protocols | Blueprint, Terminal |
| Computation, state, debugging | Terminal |
| Counterintuitive or playful | Risograph |
| Comparison, myth-busting | Newsprint |
| Human process, learning | Clay |

Then change one thing so it isn't stock: a display face, an accent shifted 20°, a border treatment. State in your handoff which palette you used, so the next explainer picks a different one.
