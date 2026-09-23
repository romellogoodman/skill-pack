---
name: web-design-guidelines
description: Review UI code for Vercel's Web Interface Guidelines compliance — 100+ rules covering accessibility, focus states, forms, animation, typography, performance, URL state, touch, dark mode, i18n, and copy. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
allowed-tools: Read Glob Grep Bash(ls *) Bash(find *) Bash(rg *) Bash(grep *) Bash(cat *) Bash(head *) Bash(sed *) Bash(wc *)
argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Vercel's Web Interface Guidelines.

This is a self-contained copy of Vercel's `web-design-guidelines` skill. The upstream skill fetches its rules from GitHub on every run; this one reads them from `reference/command.md` in this directory instead — no network access needed. See `UPSTREAM.md` for provenance and how to pull the latest rules from Vercel.

## How It Works

1. Read the rules from `reference/command.md` (this skill's directory). Do **not** fetch them from the network.
2. Glob/read the files given in `$ARGUMENTS`. If none are given, ask the user which files to review.
3. Check against every rule in the `## Rules` section, including the `### Anti-patterns` list.
4. Output findings in the terse format from the `## Output Format` section of `reference/command.md`: grouped by file, `file:line - finding`; files with no issues get `✓ pass`. No preamble.

## Notes

- `reference/command.md` is kept byte-for-byte identical to upstream so it can be diffed and refreshed cleanly. Don't hand-edit it — if a rule needs a local override, note it here in `SKILL.md` instead.
- The rules are a review checklist, not a style guide to paste into generated code wholesale. Flag violations; skip explanation unless the fix is non-obvious.
