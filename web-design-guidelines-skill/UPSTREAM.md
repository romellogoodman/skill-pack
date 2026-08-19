# Upstream & how to update

This skill is a vendored, self-contained copy of Vercel's `web-design-guidelines` agent skill. Nothing here is fetched at runtime.

## Sources

| What | Where | Vendored as |
|---|---|---|
| Skill wrapper (`SKILL.md`) | https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines | Adapted → `SKILL.md` (reads local rules instead of fetching) |
| Rules (`command.md`) | https://github.com/vercel-labs/web-interface-guidelines | Byte-for-byte → `reference/command.md` |
| License for the rules | https://github.com/vercel-labs/web-interface-guidelines/blob/main/LICENSE (MIT, © 2025 Vercel Labs) | Notice reproduced below |
| Human-readable version of the guidelines | https://vercel.com/design/guidelines | — |

The `agent-skills` repo carries no LICENSE file as of vendoring; its `SKILL.md` was ~30 lines of glue and has been rewritten here rather than copied. The substantive content — the rules — is MIT-licensed from `web-interface-guidelines`. This repo is itself MIT (see the root `LICENSE`); Vercel's notice is retained below because MIT requires it to accompany copies of their content.

### Third-party notice — `reference/command.md`

> MIT License
>
> Copyright (c) 2025 Vercel Labs
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Pinned versions (last vendored 2026-08-18)

- `vercel-labs/web-interface-guidelines` @ `e3d624baaf29dc1fc645aff3e38f03e564d2d6b1`
- `vercel-labs/agent-skills` (last commit touching `skills/web-design-guidelines`) @ `ba46938889d4e58635362fb8f618e1178ac3ec46`
- `reference/command.md` sha256: `5a775e6411f790f518dbc9c1fa7c50a89e6873502d9a3530a6eb223a590bcfe8`

## To update

Run from this directory:

```sh
# 1. See what changed upstream since the pinned SHA
curl -sL https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md \
  | diff reference/command.md - && echo "rules unchanged"

# 2. If there's a diff, pull the new rules (and re-check their LICENSE is still MIT)
curl -sL -o reference/command.md https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
curl -sL https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/LICENSE | head -3

# 3. Check whether the upstream SKILL.md wrapper changed (usually it won't matter — ours is adapted)
curl -sL https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/web-design-guidelines/SKILL.md

# 4. Re-pin: record new SHAs + hash in this file
curl -sL "https://api.github.com/repos/vercel-labs/web-interface-guidelines/commits?per_page=1" | grep -m1 '"sha"'
curl -sL "https://api.github.com/repos/vercel-labs/agent-skills/commits?path=skills/web-design-guidelines&per_page=1" | grep -m1 '"sha"'
shasum -a 256 reference/command.md
```

Then update the **Pinned versions** section above (date, SHAs, hash) and skim the diff — if upstream changed its `## Output Format` or added sections beyond `## Rules`, make sure `SKILL.md` still points at the right headings.

Never hand-edit `reference/command.md`; keep it a clean mirror so step 1 stays meaningful. Local overrides go in `SKILL.md`.
