---
name: drive-claude-code
description: Drive a second, real Claude Code session inside tmux to test a skill, plugin, slash command, CLI or other agentic experience end to end — type into it as the user would, approve its prompts, read the screen, then check what it actually produced. Use when the user asks to "test the skill for real", "run it in tmux", "play the user", "dogfood this command", or wants to see how an agent behaves in a live session rather than reading its instructions. Do NOT use for plain unit tests or scripts you can just run directly with Bash.
allowed-tools: Bash(tmux new-session *) Bash(tmux send-keys *) Bash(tmux capture-pane *) Bash(tmux pipe-pane *) Bash(tmux kill-session *) Bash(tmux ls) Bash(bash *wait-settle.sh *) Bash(mkdir *) Bash(git init *) Bash(ln -s *) Bash(ls *) Bash(cat *) Read
---

# Drive Claude Code through tmux

Run a real Claude Code session in a detached tmux pane, act as its user, and
judge the result. Reading a skill's instructions tells you what it *should*
do; driving it tells you what it *does*. Use this to find where the agent
skips steps, misreads answers, or trips on its own permission prompts.

## When this is the right tool

- Testing a skill or plugin end to end.
- Testing an interview-style or multi-turn command, where the behavior depends
  on how it responds to the user.
- Testing any interactive CLI (a REPL, a TUI, a prompt-driven installer).

Use something simpler when you can:

- A plain script or CLI with flags: run it with Bash.
- A single-turn check with no prompts to answer: `claude -p "<prompt>"` is
  headless and deterministic, and needs no tmux.

## Know what the inner session can touch

A scratch directory only protects the filesystem. The inner session also
loads your **global** setup: user skills, hooks, CLAUDE.md, memory, and every
connected MCP server (Gmail, Drive, Vercel, …). Anything it does through
those is real and outside the scratch dir.

Isolate it when the test doesn't need them:

- `--strict-mcp-config` (with no `--mcp-config`) starts it with no MCP
  servers.
- `--setting-sources project` skips your user-level settings and hooks.
- `CLAUDE_CONFIG_DIR=$L/claude-home` gives it a fresh config home — no
  global skills, memory or hooks — but you'll have to log in again inside it.

Say which of these you used. If a test needs a real integration, leave it on
and treat every call it makes as live (see "Outside the scratch dir" below).

Pin `--model` so runs are comparable and so you know what a nested session
costs.

Launch with `--permission-mode manual`. Auto mode is the default in recent
versions: the inner session approves its own tool calls, and you never see
the prompts you're meant to check. If a session is already running in auto
mode, `BTab` (shift+tab) cycles the mode; read the status bar to confirm it
says manual.

## Setup

Pick three names per run:

- `$S` — the tmux session, e.g. `myskill-1`.
- `$T` — the scratch dir the inner session works in, e.g.
  `/private/tmp/myskill-test-1`. On macOS `/tmp` is a symlink to
  `/private/tmp`, so use the resolved path. Claude Code records the resolved
  path, and permission rules and transcript folders only match that form.
- `$L` — a logs dir *beside* the scratch dir, e.g.
  `/private/tmp/myskill-test-1-logs`. Never put logs inside `$T`: the inner
  session would see them in `git status`, and a skill that reacts to stray
  files would act on your test's logs.

**Write the literal values into every command.** `$S`, `$T` and `$L` below
stand in for them. Each Bash call starts a fresh shell, so a variable you set
in one call is empty in the next. Then `tmux send-keys -t ""` goes to
whichever session is current, which may be a real one.

```bash
mkdir -p /private/tmp/myskill-test-1 /private/tmp/myskill-test-1-logs
git init -q /private/tmp/myskill-test-1
```

Number the directories so each run starts clean and earlier runs stay
inspectable.

1. **Use a scratch directory, never a real repo.** The inner session gets
   write access. Scaffold whatever the thing under test needs (a
   `package.json`, a fixture file). Don't copy real credentials in unless the
   test can't run without them — a copied `.env` is something the inner
   session can read and leak.

2. **Load the thing under test.**
   - A **plugin**: `claude --plugin-dir <path>`.
   - A **bare skill** (a directory holding `SKILL.md`, like the ones in
     skill-pack) isn't a plugin. Symlink it into the scratch dir instead:
     ```bash
     mkdir -p "$T/.claude/skills"
     ln -s <path-to-skill-dir> "$T/.claude/skills/<name>"
     ```
   - A **slash command**: put the file in `$T/.claude/commands/`.

3. **Optionally pre-allow read-only tools** so you're not approving every
   `ls`. Put a project-local `.claude/settings.local.json` in the scratch dir.
   Scope reads to the scratch dir and leave out `cat`, which would let the
   inner session read any file on disk. (You, the outer session, can use
   `cat` freely; this limit is only for the session under test.)
   ```json
   { "permissions": { "allow": ["Bash(ls:*)", "Bash(mkdir:*)", "Read(//private/tmp/myskill-test-1/**)"] } }
   ```
   Keep writes and outward-facing actions (doc creation, pushes, API writes)
   on manual approval so you see each one.

4. **Start the session detached, with a wide pane** so output doesn't wrap.
   Start a plain shell first, turn on logging, and only then launch `claude`,
   so the log includes its first screen:
   ```bash
   tmux new-session -d -s "$S" -x 200 -y 50 -c "$T"
   tmux pipe-pane -t "$S" -o "cat >> $L/pane.log"
   tmux send-keys -t "$S" -l "claude --model <model> --permission-mode manual --strict-mcp-config --plugin-dir <path>"
   tmux send-keys -t "$S" Enter
   ```
   Check `tmux ls` first so you don't collide with a session that's already
   running. Then poll until the screen settles (see "Wait for the screen").

5. **Answer the folder-trust prompt, if one appears.** Read the pane first —
   which option is highlighted varies by version. Pick the "Yes, trust"
   option: press `Enter` if it's already selected, otherwise move to it with
   `Down`/`Up` and *then* `Enter`. Never answer it without reading the screen.

## The loop

**Send text with `-l`, then Enter separately.** `-l` sends the string
literally, so words like `Enter` or `Up` inside your text aren't read as keys:
```bash
tmux send-keys -t "$S" -l "your message"; tmux send-keys -t "$S" Enter
```

**Never press Enter on an empty input box.** After each turn Claude Code
shows a suggested next prompt as ghost text in the box (e.g. "fix the error
handling gap"), and Enter sends it as if you'd typed it. Read the box after
typing to confirm it holds your text. When filtering for it, note that `❯`
is followed by a non-breaking space, so `grep "❯ your text"` misses it;
grep for the text alone.

### Wait for the screen

Don't wait a fixed time. Poll until the pane stops changing with the bundled
script, which captures the pane every few seconds and stops when two captures
match:

```bash
bash <this skill's directory>/scripts/wait-settle.sh "$S"        # 3s × 30 polls
bash <this skill's directory>/scripts/wait-settle.sh "$S" 5 60   # slower, longer
```

It exits 0 when the pane settles and 1 when it gives up, saying so; on a
give-up, read the pane before doing anything. Run it in the background (or
with Monitor) when your harness blocks foreground sleeps.

A model that is still thinking can pause for longer than one interval, so
confirm a "settled" screen is actually a prompt before you act on it.

**Read the pane.**
```bash
tmux capture-pane -t "$S" -p -S -40 | grep -v '^\s*$' | tail -25
```
`-S -40` includes scrollback; drop blank lines to keep it readable. The status
bar's wording changes between versions — if you filter it out, check the
filter against the real screen first.

**Handle prompts deliberately.** Before approving, read what's being asked.
Permission dialogs list options like:
- `1. Yes` — approve once (just press Enter).
- `2. Yes, and don't ask again for …` — `Down`, `Enter`. Fine for read-only
  tools in a scratch dir.
- `2. Yes, and switch to accept edits` — lets file writes through for the
  session.
- `No` / `Esc` — decline. Decline anything you wouldn't do yourself, such as
  reading a `.env`, and then tell the session why in a normal message.

You are the only safety check on the inner session: read every prompt, and
never approve in bulk.

**Retry transient failures once.** If the session says the API connection
dropped, check what it already wrote, then tell it where to resume ("the doc
is written; continue from Step 6"). If your own approval keystroke is blocked
as a transient error, read the pane and retry it once.

## Play the user well

- **Plant traps in your answers** that test whether the agent follows its own
  rules: a vague adjective where an example is needed, fewer examples than it
  asked for, a stated requirement it should pick up on, a combined condition
  it should split, a vague request it should push back on.
- **Change one variable between runs.** When re-testing a fix, reuse the same
  answers as the previous run, so any difference comes from the change.
- **Run each variant 2–3 times** before concluding anything. The model is
  sampled: one run that behaves differently might be the fix or might be luck.
- **Correct it at its confirmation step**, the way a real user would, and
  note that you had to.

## Check the results yourself

Never trust the inner session's handoff message. After each run:

1. **Read the files it wrote** — `cat` them from the scratch dir.
2. **Read its real transcript, not just the screen.** The session's JSONL
   transcript records every tool call and its arguments. Use it to confirm
   which tools it actually ran, and whether it skipped a step the screen made
   look done. It lives under `~/.claude/projects/`, in a folder named after
   the resolved directory the session *started in* (the tmux `-c` dir, which
   may be a subfolder of `$T`), with `/`, `.` and `_` turned into `-` (e.g.
   `-private-tmp-myskill-test-1-src`). Find it with
   `ls ~/.claude/projects | grep myskill-test-1` rather than guessing.

   `$L/pane.log` is a backup, not a clean record. It holds the raw terminal
   stream, escape codes and screen redraws included. Stripping the codes
   (`sed 's/\x1b\[[0-9;?]*[a-zA-Z]//g' pane.log`) gives a rough read, but
   it's still noisy. Use it when the transcript lacks something that only
   appeared on screen.
3. **Read any external artifacts it created** (docs, tickets, records) back
   through your own tools.
4. **Run what it built on edge cases it didn't try.** Generated checks and
   parsers often pass the examples they were written from and fail on the
   next real input.
5. **Replay its outputs live** when they're meant to be used by something
   else (a judge, an API, a scorer).

Keep a per-run log in `$L/RUNLOG.md` — **worked / missed / changes made**.
Each run's misses become the next fix, and the next run tests it. Report what
you verified, not the session's own summary.

## Clean up

- **End each run** with `tmux kill-session -t "$S"`, and run `tmux ls` to
  confirm nothing you started is still going. Kill the session even when the
  run fails or you abandon it — a leftover session keeps billing. Kill only
  sessions you started, by name; never `tmux kill-server`, which also ends
  the user's own tmux sessions.
- **Leave the scratch and logs directories** so you can inspect the results.
- **Outside the scratch dir:** anything the inner session creates there
  (shared docs, records, messages, MCP writes) is real. Ask it to title those
  clearly as a test, and tell the user what to clean up.
