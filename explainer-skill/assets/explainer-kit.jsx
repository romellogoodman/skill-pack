/**
 * EXPLAINER KIT (React) — copy this file into `src/` of a prototype-boilerplate app.
 *
 * Same session-export contract as assets/explainer-kit.html, for when the explainer
 * needs real app machinery (npm deps, heavier simulations, multiple views).
 *
 *   import { ExplainerProvider, Section, Term, Slider, Choice, Notes, Quiz, CopyBar, useCustom }
 *     from "./explainer-kit.jsx";
 *   import "./explainer-kit.scss";
 *
 *   <ExplainerProvider title="How TCP works">
 *     <Section title="Play with it">
 *       <Slider id="pipe" label="Pipe width" unit="Mbps" min={1} max={100} initial={40} />
 *       <Quiz id="q1" question="…" answer={1} options={[{ label: "…", why: "…" }, { label: "…" }]} />
 *     </Section>
 *     <CopyBar />
 *   </ExplainerProvider>
 *
 * Everything the reader touches lands in the export they paste back into the chat.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

/* ------------------------------------------------------------------ utils */

const slug = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "x";

const readStore = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}") || {};
  } catch {
    return {}; // private mode / sandboxed frame — the session still works, just isn't sticky
  }
};

const writeStore = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* non-fatal */
  }
};

/** Clipboard with the fallbacks that matter inside sandboxed iframes. */
export async function copyText(str) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(str);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = str;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

const quote = (v) =>
  String(v)
    .split(/\r?\n/)
    .map((l) => `  > ${l}`)
    .join("\n");

/* ---------------------------------------------------------------- context */

const ExplainerCtx = createContext(null);
const SectionCtx = createContext("");

export const useExplainer = () => {
  const ctx = useContext(ExplainerCtx);
  if (!ctx) throw new Error("Explainer components must render inside <ExplainerProvider>");
  return ctx;
};

export function ExplainerProvider({ title, children }) {
  const storeKey = useMemo(() => `explainer:${slug(title || document.title)}`, [title]);
  const savedRef = useRef(null);
  if (savedRef.current === null) savedRef.current = readStore(storeKey);
  const saved = savedRef.current;

  // Metadata + ordering live in a ref (not state) so registration never re-renders the tree.
  const metaRef = useRef(new Map());
  // Order is assigned once per id and never released: a component passing an inline
  // prop (display, options) re-runs its effect, and re-using a fresh sequence number
  // there would shuffle it to the end of the export on every render.
  const orderRef = useRef(new Map());
  const seqRef = useRef(0);
  const [values, setValues] = useState({});
  const [touched, setTouched] = useState(() => ({ ...(saved.t || {}) }));

  const register = useCallback(
    (id, meta) => {
      if (!orderRef.current.has(id)) orderRef.current.set(id, seqRef.current++);
      metaRef.current.set(id, { order: orderRef.current.get(id), ...meta });
      setValues((prev) => {
        if (id in prev) return prev;
        const restored = meta.kind === "quiz" ? saved.q?.[id] : saved.f?.[id];
        const initial = restored !== undefined ? restored : meta.initial;
        return initial === undefined ? prev : { ...prev, [id]: initial };
      });
      return () => metaRef.current.delete(id);
    },
    [saved],
  );

  const set = useCallback((id, value, wasTouched = true) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    if (wasTouched) setTouched((prev) => (prev[id] ? prev : { ...prev, [id]: 1 }));
  }, []);

  // Persist whenever anything changes.
  useEffect(() => {
    const f = {};
    const q = {};
    for (const [id, meta] of metaRef.current) {
      if (!(id in values)) continue;
      if (meta.kind === "quiz") q[id] = values[id];
      else if (meta.kind === "field") f[id] = values[id];
    }
    writeStore(storeKey, { f, q, t: touched });
  }, [values, touched, storeKey]);

  const entries = useCallback(
    () => [...metaRef.current.entries()].sort((a, b) => a[1].order - b[1].order),
    [],
  );

  const score = useCallback(() => {
    let right = 0;
    let answered = 0;
    let total = 0;
    for (const [id, meta] of metaRef.current) {
      if (meta.kind !== "quiz") continue;
      total++;
      const v = values[id];
      if (!v || v.picked == null) continue;
      answered++;
      if (v.picked === meta.answer) right++;
    }
    return { right, answered, total };
  }, [values]);

  const snapshot = useCallback(() => {
    const groups = new Map();
    const push = (section, line) => {
      const key = section || "(page)";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(line);
    };

    for (const [id, meta] of entries()) {
      const value = values[id];
      if (meta.kind === "quiz") {
        if (!value || value.picked == null) {
          push(meta.section, `- Q: ${meta.question} -> (unanswered)`);
          continue;
        }
        const ok = value.picked === meta.answer;
        const chosen = meta.options[value.picked];
        let line = `- Q: ${meta.question} -> "${chosen?.label ?? value.picked}" ${ok ? "[correct]" : "[wrong]"}`;
        if (!ok && meta.options[meta.answer]) line += ` (answer: "${meta.options[meta.answer].label}")`;
        if (value.tries > 1) line += ` (${value.tries} attempts)`;
        push(meta.section, line);
        continue;
      }

      const shown = meta.display ? meta.display(value) : value;
      if (shown === "" || shown == null) {
        push(meta.section, `- ${meta.label}: (blank)`);
        continue;
      }
      const text = meta.unit ? `${shown} ${meta.unit}` : String(shown);
      if (/\n/.test(text)) push(meta.section, `- ${meta.label}:\n${quote(text)}`);
      else push(meta.section, `- ${meta.label}: ${text}${touched[id] || meta.kind === "custom" ? "" : " (untouched default)"}`);
    }

    const s = score();
    const head = ["=== Explainer session export ==="];
    head.push(`Page: ${title || document.title || "untitled"}`);
    if (location.href && !location.href.startsWith("about:")) head.push(`URL: ${location.href}`);
    head.push(`Exported: ${new Date().toISOString()}`);
    if (s.total) head.push(`Quiz: ${s.right}/${s.total} correct (${s.answered} answered)`);

    const body = [...groups.entries()].map(([name, lines]) => `\n## ${name}\n${lines.join("\n")}`).join("\n");
    return `${head.join("\n")}\n${body}\n\n=== end of export ===`;
  }, [entries, values, touched, score, title]);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(storeKey);
    } catch {
      /* non-fatal */
    }
    location.reload();
  }, [storeKey]);

  const api = useMemo(
    () => ({ register, set, values, touched, snapshot, score, reset }),
    [register, set, values, touched, snapshot, score, reset],
  );

  return <ExplainerCtx.Provider value={api}>{children}</ExplainerCtx.Provider>;
}

/* --------------------------------------------------------------- sections */

export function Section({ title, children, className = "" }) {
  return (
    <SectionCtx.Provider value={title}>
      <section className={`ex-section ${className}`.trim()} aria-label={title}>
        {children}
      </section>
    </SectionCtx.Provider>
  );
}

/* ----------------------------------------------------------------- fields */

/** Low-level hook: registers any value into the export. */
export function useField({ id, label, initial, unit, display, kind = "field" }) {
  const { register, set, values, touched } = useExplainer();
  const section = useContext(SectionCtx);
  useEffect(
    () => register(id, { kind, label, section, unit, display, initial }),
    [register, id, kind, label, section, unit, display, initial],
  );
  const value = id in values ? values[id] : initial;
  return {
    value,
    setValue: useCallback((v) => set(id, v), [set, id]),
    touched: !!touched[id],
  };
}

/** Registers a derived/simulated value (read-only) into the export. */
export function useCustom({ id, label, value, display }) {
  const { register, set } = useExplainer();
  const section = useContext(SectionCtx);
  useEffect(() => register(id, { kind: "custom", label, section, display }), [register, id, label, section, display]);
  useEffect(() => set(id, value, false), [set, id, value]);
}

export function Slider({ id, label, min = 0, max = 100, step = 1, initial = 50, unit, hint }) {
  const { value, setValue } = useField({ id, label, initial, unit });
  return (
    <label className="ex-field" htmlFor={`ex-${id}`}>
      <span className="ex-field__label">
        {label}
        <span className="ex-field__value">
          {value}
          {unit ? ` ${unit}` : ""}
        </span>
      </span>
      <input
        id={`ex-${id}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? initial}
        onChange={(e) => setValue(Number(e.target.value))}
      />
      {hint && <span className="ex-field__hint">{hint}</span>}
    </label>
  );
}

export function Choice({ id, label, options, initial = "" }) {
  const { value, setValue } = useField({
    id,
    label,
    initial,
    display: (v) => options.find((o) => o.value === v)?.label ?? v,
  });
  return (
    <fieldset className="ex-field ex-field--choice">
      <legend className="ex-field__label">{label}</legend>
      {options.map((o) => (
        <label key={o.value} className="ex-field__radio">
          <input
            type="radio"
            name={`ex-${id}`}
            value={o.value}
            checked={value === o.value}
            onChange={() => setValue(o.value)}
          />
          {o.label}
        </label>
      ))}
    </fieldset>
  );
}

export function Notes({ id, label = "Notes", placeholder = "" }) {
  const { value, setValue } = useField({ id, label, initial: "" });
  return (
    <label className="ex-field" htmlFor={`ex-${id}`}>
      <span className="ex-field__label">{label}</span>
      <textarea
        id={`ex-${id}`}
        rows={4}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
      />
    </label>
  );
}

/* ------------------------------------------------------------------- quiz */

/** options: [{ label, why? }]  answer: index of the correct option */
export function Quiz({ id, question, options, answer, why }) {
  const { register, set, values } = useExplainer();
  const section = useContext(SectionCtx);
  useEffect(
    () => register(id, { kind: "quiz", question, options, answer, section }),
    [register, id, question, options, answer, section],
  );

  const state = values[id] || { picked: null, tries: 0 };
  const picked = state.picked;
  const answered = picked != null;
  const correct = answered && picked === answer;
  const explanation = answered ? (options[picked]?.why ?? why) : null;

  return (
    <div className="ex-quiz" role="group" aria-label={question}>
      <p className="ex-quiz__question">{question}</p>
      <div className="ex-quiz__options">
        {options.map((o, i) => {
          let state2 = null;
          if (answered && i === picked) state2 = correct ? "right" : "wrong";
          else if (answered && !correct && i === answer) state2 = "right";
          return (
            <button
              key={o.label}
              type="button"
              className="ex-quiz__option"
              data-ex-state={state2 || undefined}
              aria-pressed={picked === i}
              onClick={() => set(id, { picked: i, tries: (state.tries || 0) + 1 })}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {explanation && <p className="ex-quiz__why">{explanation}</p>}
    </div>
  );
}

/* ---------------------------------------------------------------- tooltip */

export function Term({ children, tip }) {
  const ref = useRef(null);
  const tipRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!open || !ref.current || !tipRef.current) return;
    const a = ref.current.getBoundingClientRect();
    const t = tipRef.current.getBoundingClientRect();
    const left = Math.min(Math.max(8, a.left + a.width / 2 - t.width / 2), window.innerWidth - t.width - 8);
    let top = a.top - t.height - 8;
    if (top < 8) top = a.bottom + 8;
    setPos({ left: Math.round(left), top: Math.round(top) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const tipId = `ex-tip-${slug(tip).slice(0, 20)}`;
  return (
    <>
      <span
        ref={ref}
        className="ex-term"
        tabIndex={0}
        aria-describedby={open ? tipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <span ref={tipRef} id={tipId} role="tooltip" className="ex-tip" style={{ left: pos.left, top: pos.top }}>
            {tip}
          </span>,
          document.body,
        )}
    </>
  );
}

/* ---------------------------------------------------------------- copy UI */

export function CopyBar({ label = "Copy my answers" }) {
  const { snapshot, score, touched, reset } = useExplainer();
  const [toast, setToast] = useState("");
  const [fallback, setFallback] = useState(null);
  const taRef = useRef(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (fallback && taRef.current) {
      taRef.current.focus();
      taRef.current.select();
    }
  }, [fallback]);

  const onCopy = async () => {
    const text = snapshot();
    if (await copyText(text)) setToast("Copied — paste it into the chat");
    else setFallback(text);
  };

  const s = score();
  const explored = Object.keys(touched).length;
  const bits = [];
  if (s.total) bits.push(`${s.answered}/${s.total} answered`);
  if (explored) bits.push(`${explored} explored`);

  return (
    <>
      <div className="ex-bar">
        <span className="ex-bar__count">{bits.join(" · ")}</span>
        <button type="button" className="ex-btn" onClick={onCopy}>
          {label}
        </button>
        <button type="button" className="ex-btn ex-btn--ghost" onClick={reset} title="Clear everything on this page">
          Reset
        </button>
      </div>

      {toast && (
        <div className="ex-toast" role="status">
          {toast}
        </div>
      )}

      {fallback !== null && (
        <div className="ex-recover" role="group" aria-label="Your session export">
          <p>This browser blocked the clipboard. Copy it by hand (Ctrl/Cmd + C) — it&rsquo;s already selected.</p>
          <textarea ref={taRef} readOnly value={fallback} />
          <div className="ex-recover__row">
            <button type="button" className="ex-btn ex-btn--ghost" onClick={() => setFallback(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
