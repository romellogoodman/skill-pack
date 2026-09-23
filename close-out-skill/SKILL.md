---
name: close-out
description: End a Claude Code session gracefully instead of closing the terminal on it — finish and commit reviewed work, stop what the session started, leave a handoff for the next session, say goodbye, then exit. Use when the user says "close out", "wrap up", or mentions /close-out.
argument-hint: "[what changed]"
---

Close out this session properly. Quitting the terminal mid-conversation
leaves work half-landed, background processes running, and nothing written
down for whoever picks this up next. This skill does the wind-down, then ends
the session itself. It never pushes.

If the project has its own close-out command (for example
`.claude/commands/close-out.md`), it knows the project's build, smoke test
and install steps: run that for the project-specific part, then continue
from step 3 here.

`$ARGUMENTS` names the change when given; otherwise take it from the
conversation and `git status` / `git diff`.

## Guard

Commit only work that is finished and that the user has seen the result of
in this conversation. Work the user has not reviewed, or that is mid-way,
stays uncommitted: say what is left in the tree and why. Never "tidy up" by
committing it anyway, and never `git stash` or discard it.

## Steps

1. **Land the work.**
   - Stop background processes this session started: dev servers, watchers,
     tunnels, anything from `run_in_background` or a trailing `&`. Leave
     processes the user started themselves alone.
   - Run the project's checks, if it defines any: scripts named `typecheck`,
     `lint`, `test`, `build`, `smoke` in `package.json`, a `Makefile`,
     `pyproject.toml`, or whatever CLAUDE.md names. Run what exists; do not
     invent checks the project lacks; never skip or narrow the run. If a
     check fails, do not try to fix it here: a fix written now is work the
     user has not reviewed, which the guard keeps out of the commit anyway.
     Leave the work uncommitted, put the failure and its output in the
     report, and skip step 5 so the user can decide.
   - Update the docs the project keeps for agents when the change touches
     what they describe: the `agent_docs/` file CLAUDE.md points at for the
     area, CLAUDE.md's overview if the feature list changed, README if
     user-facing behavior changed. Match the existing prose. Skip in projects
     with no such docs.
   - Commit the change and its docs together. Check `git status` for
     unrelated files first and stage paths, not `git add -A`. Subject in the
     repo's style (`git log --oneline -10`), one line under about 70
     characters, body only when the subject cannot carry the why. Do not
     push.

2. **Delete what the session left behind**: stray probe output, scratch
   files written into the project, temporary branches or worktrees nothing
   references. Ask before removing anything you are not sure this session
   created. An open question here means the session does not end itself:
   list what you would remove in the report and skip step 5.

3. **Write the handoff.** Save to memory (the persistent memory directory,
   when the session has one) anything the next session would otherwise have
   to rediscover: a decision the user made and why, a convention they
   corrected you on, a gotcha in the environment, what is deliberately
   unfinished and the next step. Follow the memory format in use. Do not
   save what the repo already records, and do not save the session's
   narrative; one fact per file.

4. **Say goodbye.** Print the report below as the final message. Keep it
   short and warm; it is the last thing the user reads from this session.

5. **End the session.** As the very last action, after the report is on
   screen, run:

   ```
   bash <this skill's directory>/scripts/end-session.sh
   ```

   It finds the Claude process this shell runs under and sends it SIGTERM,
   which Claude Code treats as a clean exit. Skip this step only if a check
   failed in step 1 or something in steps 1 or 2 needs the user's decision;
   then say what, and leave the session open for them.

## Report

- What landed: commit hash and subject, checks run and their result, docs
  touched.
- What did not: anything left uncommitted and why.
- What the next session should know: the handoff in one or two lines,
  and where it was saved.
- A one-line sign-off.
