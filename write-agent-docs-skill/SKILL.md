---
name: write-agent-docs
description: Write or update CLAUDE.md, AGENTS.md, and agent_docs/ for the current project, applying humanlayer.dev's CLAUDE.md best practices. Use when the user asks to create, update, improve, or audit the docs that guide coding agents in this repo.
allowed-tools: Read Write Edit Glob Bash(ls *) Bash(find *) Bash(rg *) Bash(grep *) Bash(cat *) Bash(wc *) Bash(head *) WebFetch
---

## Goal

Write or update CLAUDE.md (and any supporting agent-facing docs) for the current project, applying the principles from humanlayer.dev's CLAUDE.md best-practices guide.

## Steps

1. **Read the source of truth.** Fetch https://www.humanlayer.dev/blog/writing-a-good-claude-md every time this skill runs — do not rely on memorized guidance. Internalize the current principles before touching any file.

2. **Survey what exists.** Look for any existing `CLAUDE.md`, `AGENTS.md`, `agent_docs/`, `docs/`, `.claude/`, `README.md`. Also skim project metadata (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, etc.) so you understand the stack, entry points, and verification commands.

3. **Decide scope with the user.** Are you creating `CLAUDE.md` from scratch, editing an existing one, or adding a new `agent_docs/<topic>.md` file that `CLAUDE.md` will link to? If the user's ask is ambiguous, ask before writing.

4. **Apply the principles.** At minimum, enforce:
   - Cover WHAT (project purpose), WHY (motivation/constraints), HOW (tech stack, verification commands — tests, typecheck, build).
   - Keep `CLAUDE.md` concise. Target under 300 lines; aim for under 60 when you can.
   - Every line must be universally applicable to every task. Task-specific guidance goes in `agent_docs/`, not `CLAUDE.md`.
   - Use progressive disclosure: link to `agent_docs/<topic>.md` rather than inlining long content.
   - Prefer `file:line` references over embedded code snippets — snippets go stale.
   - No linter/style rules (indent width, quote style, trailing commas). That's the linter's job and it wastes the ~150–200-instruction budget frontier models follow reliably.
   - Don't use `CLAUDE.md` as a hotfix bin for behavior corrections.
   - Hand-craft it; do not autogenerate.

5. **Write it.** Prefer `Edit` for updates over `Write`. Only create new files when the content clearly belongs in a dedicated doc (progressive disclosure).

6. **Report.** Summarize what changed, the resulting line count of `CLAUDE.md`, and call out anything that would be better placed in a separate `agent_docs/` file but isn't written yet — so the user can follow up.

## Notes

- If the repo uses `AGENTS.md` (the cross-agent convention) instead of or alongside `CLAUDE.md`, apply the same principles to whichever file the user is targeting.
- If `$ARGUMENTS` is provided, treat it as scope guidance (e.g. "add a section on the new migration workflow" or "just update the verification commands").
