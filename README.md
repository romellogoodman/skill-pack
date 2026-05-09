# skill-pack

A collection of skill files for Claude Code and other coding agents.

Each subdirectory is a self-contained skill — drop it into your agent's skills directory (or symlink it) and invoke by name.

## Skills

- **[init-project-skill](./init-project-skill/)** — Bootstrap a new project with CLAUDE.md and `.claude/commands` from a boilerplate, guided by humanlayer.dev's CLAUDE.md best practices.
- **[video-dissect-skill](./video-dissect-skill/)** — Analyze a video by extracting frames with ffmpeg and producing a scene-by-scene breakdown.
- **[write-agent-docs-skill](./write-agent-docs-skill/)** — Write or update CLAUDE.md and agent docs for a project, applying humanlayer.dev's CLAUDE.md best practices (fetched fresh each run).
