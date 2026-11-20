---
name: hillclimb
description: Improve a prompt, skill, tool description, model/effort choice or harness against an eval, one attributable change per round, with a held-out test set to catch overfitting — and build or repair the eval first when there isn't a trustworthy one. Use when the user wants to hillclimb, tune or optimize an LLM app or skill against an eval, cut its cost while holding quality, build an eval for it, or mentions /hillclimb.
argument-hint: "[what to improve] [goal: performance | cost]"
---

Hillclimb the thing the user names against an eval: measure, make one
change, measure again, keep it only if a held-out set agrees. The method is
from Lance Martin's "Automating eval design and hillclimbing with Claude"
(claude.dev, 2026-09-28), which describes `/claude-api build-eval` and
`/claude-api hillclimb`. This skill is the same loop for any target, with
no dependency on that skill.

`$ARGUMENTS` names the target and goal when given; otherwise ask.

A score is only worth climbing if the eval is sound, so the order is fixed:
eval first, noise second, rounds third. Do not start editing the target
until phases 1 and 2 pass.

## Phase 0: Scope

Settle three things with the user before running anything.

1. **Surface.** What may be edited: system prompt, skill or instruction
   file, tool descriptions, model / effort / other API parameters, harness
   code. Prefer a surface that is cheap to change and revert (text) and
   where a score change can be attributed to the edit. Edit nothing outside
   it.
2. **Objective.** Either *performance*, or *cost with performance held at
   parity*. "Improve it" on a saturated eval or a vague surface ("update
   the harness") stalls; push back and narrow it. Cost is the strong
   default when the baseline is already high.
3. **Smallest gain worth acting on.** For example +3 points, or 20% cheaper
   at no loss. Phase 2 checks the eval can resolve it.

## Phase 1: A trustworthy eval

If an eval exists, audit it against
[references/eval-design.md](references/eval-design.md). If none exists,
build one by following that file, pausing for the user's approval of the
cases and of the grader. Either way, do not proceed until:

- Cases mirror production and were not chosen because the current model
  fails them.
- The grader gives the same verdict when run twice on the same output, and
  the user agrees with its verdicts on a sample they have read.
- Timeouts, API errors and cut-off answers are counted separately from
  wrong answers.
- Each run starts from clean state, and reference answers are structurally
  out of reach of the system under test (not in its working directory, git
  history, or anywhere it can fetch).
- The baseline has headroom. At about 95% or above, say so and switch the
  objective to cost or latency.

## Phase 2: Split and measure noise

1. **Split** the cases at random into *train* and *test* (roughly 70/30;
   stratify by tag if cases are tagged). Record the split in a file and
   never change it. From here on you read train transcripts only. You never
   open a test transcript, test input, or test expected output: from test
   you see aggregate scores and nothing else. Have the runner write test
   transcripts somewhere you do not read.
2. **Baseline** both sets with repeats (at least 3 per case). Report mean
   score with a confidence interval, plus cost and latency per case.
3. **Noise check.** Estimate how far the score moves by chance alone (the
   spread across repeated baseline runs). If that is not clearly smaller
   than the smallest gain from Phase 0, stop and recommend more repeats or
   more cases. Climbing inside the noise produces a random walk that looks
   like progress.
4. Tell the user the size of what is about to run (cases × repeats ×
   rounds, estimated time and spend) and get a go-ahead before spending it.

Keep a ledger, `hillclimb-log.md` beside the eval: one row per round with
the hypothesis, the patch (commit or diff path), train and test scores with
intervals, cost, and kept/reverted. Commit or otherwise snapshot the target
before round one so every round is revertible.

## Phase 3: Rounds

Each round:

1. **Read** the previous round's failing *train* transcripts. Read the
   whole transcript, not the score line.
2. **Propose one change**, as a patch, aimed at a root cause: rewrite the
   section that causes the failure, add the missing rule, remove the
   contradiction. Not a reworded line, and not one patch per failure. Size
   it so its effect should show above the noise. State the hypothesis in a
   sentence before running: what will change and which cases should flip.
3. **Run** train and test with the patch, same repeats as baseline.
4. **Decide:**

   | Train | Test | Action |
   | --- | --- | --- |
   | up | up | keep |
   | up | flat | suspect overfitting: revert |
   | any regression on the objective or its guardrail | | revert |
   | within noise on both | | revert; the change bought nothing |

   For a cost objective, "up" means cheaper, and performance dropping
   beyond noise on either set is a regression.
5. **Log** the round, kept or not.

### Overfitting rules

These hold for every patch, without exception:

- Never paste content from a failing case into the prompt or skill: not its
  input, its phrasing, its expected answer, nor an example that paraphrases
  it. Fix the general cause the failure reveals.
- Nothing eval-specific in the target: no paths, repo names, commands, or
  tools that exist only because the eval environment has them. Ask of each
  patch: would this help a production request that looks nothing like the
  eval?
- A new tool or rule that only one case needs is a patch for that case.
- If the system under test finds a way to reach the answers (a reference
  solution online, a leftover file), that is an eval bug. Close the leak;
  do not keep the score.

### Cost objective

Try these in order, one per round, checking performance holds each time:

1. Audit the prompt for the model in use: remove mandatory tool-call
   rituals, scratchpad steps, contradictory or redundant rules, and
   workarounds written for an older model.
2. Lower effort on the current model.
3. Step down a model tier, or to a newer model that is cheaper per token.
4. Prompt caching: stable prefix first, volatile content last.
5. Then spend a little of the saving on targeted prompt fixes to recover
   any accuracy lost.

Check current model names and prices rather than recalling them.

### Reflection

When the score stalls for two or three rounds, or earlier if no single fix
could plausibly beat the noise, stop editing. Read every remaining train
failure and sort it by cause:

- **Legitimate failure**: the target did the wrong thing. Group by root
  cause; several failures sharing one cause (for instance, the model
  writing an outdated API shape from memory) is the next round's patch.
- **Ambiguous task**: two experts could disagree, or the grader checks
  something the task never states.
- **Grader error**: a correct answer marked wrong, or a grader that
  contradicts the source of truth. Verify against the real thing (run the
  API, read the docs) before deciding which side is wrong.
- **Harness or infra error**, or pure variance.

Only legitimate failures feed further rounds. Fixing a task or grader
changes the eval: show the user the proposed fix, apply it to both sets by
rule rather than by reading test cases, and re-baseline before continuing,
since scores across an eval change are not comparable.

## Phase 4: Finish

Stop when the goal is met, when reflection finds no legitimate failures
left to fix, or when the user's budget is spent.

1. Leave the target at the version that is best **on the test set** for
   the objective, not the latest round and not the best on train.
2. Report test score versus baseline with confidence intervals, cost and
   latency before and after, the kept changes in one line each, and what
   was tried and reverted.
3. If the gain is within noise, say so plainly and recommend against
   merging.
4. List eval problems found along the way that were not fixed.
5. Do not commit or merge the result unless asked.
