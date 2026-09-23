# Component reference

Markup contracts for both kits. Same export format either way, so the copy-back behaviour is identical.

- **Single-file:** `assets/explainer-kit.html` — paste its `<style>` and `<script>` blocks into the page.
- **Proto/React:** `assets/explainer-kit.jsx` + `assets/explainer-kit.scss` — copy into `src/`.

---

## Layout

```html
<main class="ex-canvas">
  <p>Prose sits at the 800px measure.</p>
  <figure class="ex-wide">Diagrams and sims break out wider.</figure>
  <div class="ex-full">Edge to edge.</div>
</main>
```

Override per page with `--ex-measure` and `--ex-breakout`. `Section` / `.ex-section` re-exposes the canvas columns via subgrid, so children stay on the measure and can still break out.

---

## Tooltips

```html
<span class="ex-term" data-ex-tip="The raw score before it becomes a probability.">logit</span>
```

```jsx
<Term tip="The raw score before it becomes a probability.">logit</Term>
```

Hover, focus and tap all work; `Escape` and scroll dismiss. The tooltip is positioned to stay in the viewport and flips above/below as needed. Define the term, don't restate it — "Latency: the latency" is a wasted tooltip.

---

## Fields

Anything the reader sets. All of it lands in the export.

### Vanilla

```html
<section data-ex-section="Play with it">
  <label>Pipe width
    <input id="pipe" type="range" min="1" max="100" value="40"
           data-ex-field data-ex-label="Pipe width" data-ex-unit="Mbps">
  </label>
  <output data-ex-value-of="pipe"></output>

  <select id="dist" data-ex-field data-ex-label="Distance">
    <option value="near">Same city</option>
    <option value="far">Across the ocean</option>
  </select>

  <fieldset data-ex-field data-ex-label="Your guess">
    <legend>Which is the bottleneck?</legend>
    <label><input type="radio" name="g" value="bw"> Bandwidth</label>
    <label><input type="radio" name="g" value="lat"> Latency</label>
  </fieldset>

  <textarea id="notes" data-ex-field data-ex-label="Notes"></textarea>
</section>
```

| Attribute | Meaning |
| --- | --- |
| `data-ex-field` | Register this control in the export |
| `data-ex-label` | Human label used in the export |
| `data-ex-unit` | Appended to the value (`72 Mbps`) |
| `data-ex-key` | Stable storage key; defaults to `id`, then a slug of the label |
| `data-ex-value-of="key"` | Element that mirrors that field's current value |
| `data-ex-section` | Groups everything inside it under one heading |

For a radio group, put `data-ex-field` on the **wrapper**, not each input. Selects export their option *text* but persist their `value`.

### React

```jsx
<Section title="Play with it">
  <Slider id="pipe" label="Pipe width" min={1} max={100} initial={40} unit="Mbps" hint="Drag to both extremes." />
  <Choice id="guess" label="Your guess" options={[
    { value: "bw", label: "Bandwidth" },
    { value: "lat", label: "Latency" },
  ]} />
  <Notes id="notes" label="Notes" placeholder="…" />
</Section>
```

---

## Quiz

### Vanilla

```html
<div class="ex-quiz" data-ex-q="A video call stutters. What helps most?" data-ex-answer="1"
     data-ex-why="Calls are latency-bound, not throughput-bound.">
  <div class="ex-opts">
    <button class="ex-opt" data-ex-why="More bandwidth moves more bytes, but not sooner.">A fatter pipe</button>
    <button class="ex-opt">A shorter round trip</button>
  </div>
</div>
```

### React

```jsx
<Quiz
  id="q-call"
  question="A video call stutters. What helps most?"
  answer={1}
  options={[
    { label: "A fatter pipe", why: "More bandwidth moves more bytes, but not sooner." },
    { label: "A shorter round trip" },
  ]}
  why="Calls are latency-bound, not throughput-bound."
/>
```

`answer` is the 0-based index. A per-option `why` overrides the quiz-level one — use it to explain why *that* wrong answer is tempting. Re-answering is allowed and attempts are counted, so the export shows who got it second try.

---

## Custom widgets

Canvas sims, drag interactions, anything hand-rolled. **Register it or it won't be in the export** — the most common way a session comes back incomplete.

```js
Explainer.register({
  id: "orbit-sim",
  label: "Simulation",
  section: "Play with it",
  get: () => `${bodies.length} bodies, ${collisions} collisions`,
});
Explainer.sync(); // after mutating state programmatically
```

```jsx
useCustom({
  id: "orbit-sim",
  label: "Simulation",
  value: `${bodies.length} bodies, ${collisions} collisions`,
});
```

Return a sentence a human can read, not a JSON dump.

---

## Copy bar

Vanilla mounts it automatically — suppress with `data-ex-nobar` on `<body>` and call `Explainer.mountBar()` yourself. React: `<CopyBar />` inside the provider.

One click copies straight to the clipboard and shows a toast. The `.ex-recover` panel appears only if the browser blocks the clipboard: non-modal, text pre-selected. Reset clears storage and reloads.

State persists to `localStorage` under `explainer:<slug of path>:<slug of title>` (the page's `<title>`, or `<ExplainerProvider title>` in React), wrapped so a sandboxed frame degrades to a working-but-not-sticky page. Give every explainer its own title — two explainers served from the same path (every proto project is `/` on `localhost:8123`) with the same title share saved state.

---

## Export format

```
=== Explainer session export ===
Page: Temperature and top-p
URL: http://localhost:8123/
Exported: 2026-08-09T03:07:26.008Z
Quiz: 2/3 correct (3 answered)

## The distribution
- Temperature: 1.85
- Distribution at that temperature: top="sat", 56% of mass outside the top token

## Predict before you look
- Your prediction: The ranking holds, the gaps just shrink

## Check yourself
- Q: Does raising temperature change which token is most likely? -> "No — it only flattens the gaps" [correct] (2 attempts)
- Q: What does temperature = 0 give you? -> "An error" [wrong] (answer: "Greedy decoding")
- Q: top-p = 0.9 does what? -> (unanswered)

## Your turn
- Your case:
  > our extractor invents field names
  > about 1 in 20 calls

=== end of export ===
```

Sections follow page order. Untouched controls are marked `(untouched default)` — that flag is a signal the reader skipped past an interaction.

---

## JS API

| Call | Does |
| --- | --- |
| `Explainer.snapshot()` | The export string |
| `Explainer.copy()` | Copy + toast, with fallback |
| `Explainer.score()` | `{ right, answered, total }` |
| `Explainer.register(entry)` | Add a custom provider |
| `Explainer.sync()` | Persist + refresh the bar after programmatic changes |
| `Explainer.mountBar()` | Mount the bar manually |

React: `useExplainer()` returns `{ snapshot, score, values, touched, set, reset }`; `useField`, `useCustom`, `copyText` are exported too.
