# Eval design

How to build an eval worth hillclimbing against, or audit one that exists.
Summarized from Lance Martin, "Automating eval design and hillclimbing with
Claude" (claude.dev, 2026-09-28).

## What a good eval looks like

1. **Tasks mirror production.** Not tasks that happen to be easy to
   generate or easy to grade.
2. **Scores rise with a stronger model and with more thinking.** If they
   don't, suspect ambiguous tasks or a miscalibrated grader.
3. **Passable headroom at the frontier.** The best model at its highest
   effort lands well below 100%, and the gap is not made of impossible or
   ambiguous tasks. Tell: a task that fails every replicate. A good task is
   one where two domain experts would reach the same verdict and everything
   the grader checks is stated in the task.
4. **Low run-to-run variance.** Usual sources: ambiguous tasks, a grader
   that gives different verdicts on identical output, inconsistent effort
   settings, and leftover environment state (files, git history) that leaks
   the answer.

## Choosing cases

Interview the user first: what the system does, what a good output is, what
has gone wrong in production. Then draw inputs from these sources, in
order of preference:

1. Production transcripts. Ask about retention rules and sensitive data
   before reading or copying any.
2. Bug reports and support tickets: specific failures that really happened.
3. Five to ten cases the user writes by hand.
4. Cases synthesized from the codebase, anchored in a few real examples
   where possible.

Tag each case (category, easy / hard / ambiguous) so results can be sliced
and the train/test split stratified.

**Do not sample adversarially.** Picking cases because today's model fails
them samples only its valleys: the eval then measures that model's failure
fingerprint, and any change of model looks like progress. Pick hard cases
that a human judged hard, and be able to say why each is hard.

**Do not trust traffic blindly either.** Users mostly try what they expect
to work, so raw traffic skews easy.

Show the user every input, as a page or a table, and wait for confirmation
before building further.

## The grader

Use the cheapest grader that fits.

- **Programmatic** when the output is constrained: exact match, a fixed
  label set, a JSON schema, passing tests.
- **LLM judge** when the output is open-ended but the criteria are clear.
  Give it the input, the output, and a rubric of checkable claims, not a
  1-to-5 scale. It returns a score and its reasoning. When there is a
  baseline, give it both outputs in random order, unlabeled, and have it
  pick the better. The user chooses the judge model; it should not be the
  model under test.

**Validate it.** Grade a handful of outputs, show the user the verdicts
with the transcripts, and ask whether they would have scored any
differently. Scoring errors are among the most common eval
misconfigurations, and reading sampled transcripts is the only way to find
them.

## What to build

- The cases, the grader, and a runner that takes a split name and a repeat
  count.
- Per case and repeat: one JSON line of result (case id, score, grader
  reasoning, tokens, cost, latency, error status) and one full transcript.
- A results page or table linking each case to its transcript. Keep any
  page static and local, loading nothing from the network.

Before the baseline, tell the user the size of the run: cases × repeats ×
model, with estimated time and cost.

## Checks during the baseline

- **Grader stability:** run the grader twice on the same output and report
  whether any verdict changed.
- **Plumbing:** count timeouts, API errors and truncated answers, so
  infrastructure noise is not read as model variance.
- **Headroom:** at roughly 95% or above, warn the user. There is little
  quality left to climb; target cost or latency instead.
- **Clean state:** every run starts from the same environment, with the
  reference answers out of the system's reach.

Report the baseline as a mean with a confidence interval, never a bare
number.
