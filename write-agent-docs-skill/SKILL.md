---
name: write-agent-docs
description: Write or update CLAUDE.md, AGENTS.md, and agent_docs/ for the current project, applying humanlayer.dev's CLAUDE.md best practices. Use when the user asks to create, update, improve, or audit the docs that guide coding agents in this repo.
allowed-tools: Read Write Edit Glob Grep Bash(ls *) Bash(find *) Bash(rg *) Bash(grep *) Bash(cat *) Bash(wc *) Bash(head *) Bash(ln *) WebFetch
---

## Goal

Write or update CLAUDE.md (and any supporting agent-facing docs) for the current project, applying the principles from humanlayer.dev's [Writing a good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md).

## Principles

Summarized from the post (published 2025-11-25, last checked 2026-09-22). This summary is the working copy — no fetch needed. If the user asks for the latest guidance, fetch the post and note anything that changed.

- Cover WHAT (stack, structure, a map of the codebase), WHY (what the project is for), HOW (tooling and how to verify a change — tests, typecheck, build).
- Keep `CLAUDE.md` short: under 300 lines, under 60 when you can. Frontier models follow ~150–200 instructions reliably and the harness already spends ~50; every added line dilutes the rest.
- Every line must apply to every task. Task-specific guidance goes in `agent_docs/<topic>.md`, listed in `CLAUDE.md` with a one-line description so the agent decides what to read (progressive disclosure).
- Prefer pointers to copies: `file:line` references over pasted snippets, which go stale.
- No style rules (indent width, quote style, trailing commas) — that's a linter's or a hook's job.
- Don't list every command the agent might run, and don't use `CLAUDE.md` as a hotfix bin for one-off behavior corrections.
- Don't paste `/init` output or other generated boilerplate. Write each line from what you verified in the repo.

## Steps

1. **Survey what exists.** Look for any existing `CLAUDE.md`, `AGENTS.md`, `agent_docs/`, `docs/`, `.claude/`, `README.md`. Also skim project metadata (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, etc.) so you understand the stack, entry points, and verification commands. Run the verification commands you intend to document, or confirm they exist in the scripts.

2. **Decide scope with the user.** Are you creating `CLAUDE.md` from scratch, editing an existing one, or adding a new `agent_docs/<topic>.md` file that `CLAUDE.md` will link to? If the user's ask is ambiguous, ask before writing.

3. **Write it.** Prefer `Edit` for updates over `Write`. Only create new files when the content clearly belongs in a dedicated doc (progressive disclosure).

4. **Report.** Summarize what changed, the resulting line count of `CLAUDE.md`, and call out anything that would be better placed in a separate `agent_docs/` file but isn't written yet — so the user can follow up.

## CLAUDE.md and AGENTS.md

Claude Code reads `CLAUDE.md`; most other agents (Codex, Cursor, Zed, OpenCode) read `AGENTS.md`. Keep one source of truth:

- Only one exists → edit that one. Offer to add the other only if the user uses more than one agent.
- Both exist with overlapping content → make `AGENTS.md` canonical and reduce `CLAUDE.md` to a single line, `@AGENTS.md` (Claude Code imports it), plus anything genuinely Claude-specific. Ask before collapsing an existing file.
- Symlinking `CLAUDE.md → AGENTS.md` also works, but an import leaves room for Claude-only lines.

## Notes

- If `$ARGUMENTS` is provided, treat it as scope guidance (e.g. "add a section on the new migration workflow" or "just update the verification commands").
