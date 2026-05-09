---
name: init-project
description: Bootstrap a new project with CLAUDE.md and .claude/commands from the prototype-boilerplate, guided by best practices from humanlayer.dev
allowed-tools: Bash(mkdir *) Bash(cp *) Read Write Edit Bash(ls *) Bash(cat *) WebFetch
---

## Goal

Set up CLAUDE.md and .claude/commands in the current working directory, using ~/code/prototype-boilerplate as the base template and adapting it to the current project.

## Steps

1. **Read the blog post** for guiding principles:
   Fetch https://www.humanlayer.dev/blog/writing-a-good-claude-md and internalize the key takeaways:
   - CLAUDE.md should be concise (under 300 lines, ideally under 60)
   - Every line must be universally applicable — no task-specific guidance
   - Use progressive disclosure: keep separate docs and point to them rather than inlining everything
   - Never send an LLM to do a linter's job — use hooks/tools for formatting
   - Less is more — frontier models follow ~150-200 instructions reliably

2. **Copy the boilerplate CLAUDE.md** from `~/code/prototype-boilerplate/CLAUDE.md` into the current directory. If a CLAUDE.md already exists, ask before overwriting.

3. **Copy .claude/commands/** from `~/code/prototype-boilerplate/.claude/commands/` into `.claude/commands/` in the current directory. Create the directory if needed.

4. **Adapt CLAUDE.md** to the current project:
   - Look at the current directory for clues about the tech stack (package.json, Cargo.toml, pyproject.toml, go.mod, etc.)
   - Update the CLAUDE.md to reflect the actual project structure and stack while keeping it concise per the blog post principles
   - If $ARGUMENTS is provided, incorporate that context (e.g. "this is a Python FastAPI project")

5. **Report** what was set up and suggest next steps (e.g. "review CLAUDE.md and tailor it further").
