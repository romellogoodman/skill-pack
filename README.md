# skill-pack

A collection of skill files for Claude Code and other coding agents.

Each subdirectory is a self-contained skill — drop it into your agent's skills directory (or symlink it) and invoke by name.

## Skills

- **[init-project-skill](./init-project-skill/)** — Bootstrap a new project with CLAUDE.md and `.claude/commands` from a boilerplate, guided by humanlayer.dev's CLAUDE.md best practices.
- **[video-dissect-skill](./video-dissect-skill/)** — Analyze a video by extracting frames with ffmpeg and producing a scene-by-scene breakdown.
- **[write-agent-docs-skill](./write-agent-docs-skill/)** — Write or update CLAUDE.md and agent docs for a project, applying humanlayer.dev's CLAUDE.md best practices (fetched fresh each run).
- **[grill-me-skill](./grill-me-skill/)** — Interview the user relentlessly about a plan or design, one question at a time via `AskUserQuestion`, until reaching shared understanding.
- **[save-report-skill](./save-report-skill/)** — Save a report Claude produced to the Desktop as markdown, with frontmatter for title, date, tags, working directory, git branch, and worktree.
- **[arena-research-skill](./arena-research-skill/)** — Research a topic on Are.na with curl + jq: search curated channels, follow the connection graph to adjacent collections and curators, synthesize a sourced briefing. Works on public Are.na with no setup; to include your own private collections, [create a personal access token](https://www.are.na/developers/personal-access-tokens) and `export ARENA_READ_TOKEN="..."` in your shell profile.
