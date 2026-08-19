# skill-pack

A collection of skill files for Claude Code and other coding agents.

Each subdirectory is a self-contained skill — drop it into your agent's skills directory (or symlink it) and invoke by name.

## Skills

- **[init-project-skill](./init-project-skill/)** — Bootstrap a new project with CLAUDE.md and `.claude/commands` from a boilerplate, guided by humanlayer.dev's CLAUDE.md best practices.
- **[video-dissect-skill](./video-dissect-skill/)** — Analyze a video by extracting frames with ffmpeg and producing a scene-by-scene breakdown.
- **[write-agent-docs-skill](./write-agent-docs-skill/)** — Write or update CLAUDE.md and agent docs for a project, applying humanlayer.dev's CLAUDE.md best practices (fetched fresh each run).
- **[grill-me-skill](./grill-me-skill/)** — Interview the user relentlessly about a plan or design, one question at a time via `AskUserQuestion`, until reaching shared understanding.
- **[save-report-skill](./save-report-skill/)** — Save a report Claude produced to the Desktop as markdown, with frontmatter for title, date, tags, working directory, git branch, and worktree.
- **[explainer-skill](./explainer-skill/)** — Build an interactive explainer website for a concept: tooltips on jargon, interactive sections, a misconception-targeting quiz, and a one-click export of every answer and setting to paste back into the chat. Ships a tested runtime in two flavors — a drop-in `<style>`/`<script>` pair for single-file pages (publishable as an artifact) and a React/SCSS version for the [prototype-boilerplate](https://github.com/romellogoodman/prototype-boilerplate) `proto` setup — plus six palettes so explainers don't all look alike.
- **[arena-research-skill](./arena-research-skill/)** — Research a topic on Are.na with curl + jq: search curated channels, follow the connection graph to adjacent collections and curators, synthesize a sourced briefing. Works on public Are.na with no setup; to include your own private collections, [create a personal access token](https://www.are.na/developers/personal-access-tokens) and `export ARENA_READ_TOKEN="..."` in your shell profile.
- **[web-design-guidelines-skill](./web-design-guidelines-skill/)** — Self-contained copy of Vercel's [`web-design-guidelines`](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) skill: review UI code against 100+ [Web Interface Guidelines](https://vercel.com/design/guidelines) rules (accessibility, focus, forms, animation, typography, performance, URL state, dark mode, i18n, copy) and report terse `file:line` findings. Rules are vendored locally rather than fetched at runtime; see its `UPSTREAM.md` to pull the latest from Vercel.
- **[proportional-web-skill](./proportional-web-skill/)** — Typeset a prose document (essay, post, manual, book chapter, report) as an HTML page in the style of Oskar Wickström's [The Proportional Web](https://owickstrom.github.io/the-proportional-web/): Bringhurst-derived print typography — Alegreya, justified & hyphenated text, 3ch paragraph indents, 1.2rem baseline rhythm, small-caps names, margin asides, black on white. Vendors the MIT stylesheet/JS plus a markup contract and starter page; works from raw HTML or Pandoc. See its `UPSTREAM.md` to pull updates.

## License

[MIT](./LICENSE). Two skills vendor third-party MIT content — Vercel's Web Interface Guidelines and Oskar Wickström's The Proportional Web — with their notices retained in each skill's `UPSTREAM.md`.
