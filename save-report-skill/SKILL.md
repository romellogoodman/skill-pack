---
name: save-report
description: Save a report/summary Claude just produced to the Desktop as a markdown file with frontmatter (title, date, tags, working directory, git branch, worktree). Use when the user asks to save, export, or write a report/summary to the desktop.
allowed-tools: Read Write Bash(pwd) Bash(date *) Bash(echo $HOME) Bash(ls *) Bash(git *)
---

## Goal

Persist a report Claude has written (or is about to write) to `~/Desktop` as a single markdown file, with YAML frontmatter that captures where and when it was produced.

## Steps

1. **Identify the report content.** Use the report/summary already produced in the conversation. If none exists yet, write it first based on what the user asked for.

2. **Derive metadata:**
   - `title` — infer a short, specific title from the content (not "Report"). Slugify it (lowercase, hyphens) for the filename.
   - `date` — today's date, `YYYY-MM-DD`. Get it from `date +%F`, don't guess.
   - `tags` — infer 3-6 lowercase kebab-case tags from the content's actual subject matter (e.g. `[ci, github-actions, flaky-tests]`). No generic filler tags like `report` or `notes`.
   - `directory` — the working directory the agent was in while producing this report. Run `pwd`.
   - `branch` — run `git branch --show-current` from that directory. If it prints nothing but `git rev-parse --git-dir` succeeds, HEAD is detached — use `detached@<git rev-parse --short HEAD>`. Omit the field entirely only when not inside a git repo.
   - `worktree` — only set if the current checkout is a linked worktree (not the main one). Detect with `git rev-parse --git-dir` vs `git rev-parse --git-common-dir`: if they differ, it's a worktree — set this to the path from `git rev-parse --show-toplevel`. Omit the field otherwise.

3. **Compose the file.** Double-quote `title`, `directory` and `worktree`, escaping any `"` or `\` inside them — a colon in a title (`CI: flaky tests`) otherwise breaks the YAML.
   ```
   ---
   title: "<title>"
   date: <YYYY-MM-DD>
   tags: [<tag1>, <tag2>, ...]
   directory: "<absolute path>"
   branch: <branch name>        # omit if not in a git repo
   worktree: "<worktree path>"  # omit if not a linked worktree
   ---

   <report content, unchanged>
   ```

4. **Pick a path that doesn't exist.** The Write tool needs an absolute path, so resolve `~` first (`echo $HOME`): `<HOME>/Desktop/<slugified-title>-<date>.md`. Check it with `ls`; if it exists, append `-2`, `-3`, … until it doesn't. Never overwrite an earlier report. Don't create a subfolder — reports land flat in Desktop.

5. **Write it** with the `Write` tool and confirm the saved path back to the user in one line.
