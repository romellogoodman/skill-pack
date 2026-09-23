---
name: init-project
description: Bootstrap a new project with CLAUDE.md and .claude/commands (commit, commit-push-pr) from the prototype-boilerplate, guided by best practices from humanlayer.dev
allowed-tools: Bash(mkdir *) Bash(cp *) Bash(ls *) Bash(cat *) Read Write Edit Glob Grep
---

# Init Project

Set up `CLAUDE.md` and `.claude/commands/` in the current working directory. Everything needed ships in this skill's directory:

```
CLAUDE.md           the prototype-boilerplate's CLAUDE.md (React 19 + Vite + SCSS, BEM) — a template for that stack only
commit.md           /commit command
commit-push-pr.md   /commit-push-pr command
```

## Principles

From humanlayer.dev's [Writing a good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md) (checked 2026-09-22):

- Cover WHAT (stack, structure), WHY (purpose), HOW (how to run and verify a change).
- Under 300 lines, ideally under 60. Every line must apply to every task.
- Progressive disclosure: task-specific guidance goes in `agent_docs/<topic>.md`, linked from `CLAUDE.md`.
- No style rules — that's the linter's job. No `/init` boilerplate.

For anything beyond a first draft — auditing, `AGENTS.md`, `agent_docs/` — use the `write-agent-docs` skill.

## Steps

1. **Install the commands.** `mkdir -p .claude/commands`, then copy `commit.md` and `commit-push-pr.md` from this skill's directory into it. If a command file with the same name already exists, ask before overwriting.

2. **Identify the stack.** Look for `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, etc. If `$ARGUMENTS` is provided, treat it as context (e.g. "this is a Python FastAPI project").

3. **Write `CLAUDE.md`.** If one already exists, ask before replacing it.
   - **Prototype-boilerplate stack** (`package.json` with `vite`, `react` and `sass`, or an empty directory the user is about to fill with the boilerplate): copy this skill's `CLAUDE.md`, then update the custom-property list and any structure that differs from what's actually in `src/`.
   - **Any other stack:** don't use the template — its React/BEM rules would apply to nothing. Write a short `CLAUDE.md` from scratch following the principles above: one line on what the project is, the real run/test/build commands (read them from the manifest), and a map of the top-level directories.

4. **Report** what was set up, the line count of `CLAUDE.md`, and suggest next steps (e.g. "review CLAUDE.md and tailor it further").

## Notes

- `CLAUDE.md`, `commit.md` and `commit-push-pr.md` are copies of `~/code/prototype-boilerplate`'s files, except that `commit.md` here follows the repo's existing commit style rather than always using conventional prefixes. When the boilerplate changes, re-copy them.
