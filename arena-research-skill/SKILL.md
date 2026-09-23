---
name: arena-research
description: Research a topic on Are.na — search for curated channels, browse their contents, follow the connection graph to adjacent collections and key curators, and synthesize a sourced briefing. Use when the user wants curated references, visual inspiration, reading lists, design/cultural research, or to see how people organize ideas around a topic — including searching their own or private Are.na collections.
allowed-tools: Bash(curl *) Bash(jq *) WebFetch
---

# Arena Research

Research a topic on Are.na using curl and jq against the public API. Are.na is a library, not a firehose — the value isn't just what people saved, it's *how they organized it* and *what else they connected it to*. A channel's structure is itself a research finding.

## Usage

Invoked with a research question or topic. If none is provided, ask what the user wants to research.

## API Basics

- **Search** uses the v2 API (`https://api.are.na/v2`). The v3 search endpoint biases results toward the authenticated user's own network, so it is only useful for searching your own collections.
- **Everything else** (channels, blocks, users) uses the v3 API (`https://api.are.na/v3`).
- **Auth is optional but unlocks more.** Channel/user search and all v3 reads of public content work unauthenticated at 30 requests/min. If `ARENA_READ_TOKEN` is set in the environment, add `-H "Authorization: Bearer $ARENA_READ_TOKEN"` to every request — it raises the rate limit (120–600/min depending on account tier) and unlocks private channels the user has access to and searching their own collections. If the user asks for their own or private collections and the variable is unset, point them to https://www.are.na/developers/personal-access-tokens to create a token and export it as `ARENA_READ_TOKEN`. Never echo the token.
- **Pagination:** all list endpoints take `page` and `per` (max 100, default 24).
- **Always filter through jq.** Raw responses are large (nested `_links`, multi-resolution image URLs). Never dump raw JSON into the conversation.
- URL-encode queries with `curl -sG ... --data-urlencode "q=..."`.

## Recipes

All verified against the live API. `$Q` is the query, `$SLUG`/`$ID` the target.

### Search channels (primary entry point)

```bash
curl -sG "https://api.are.na/v2/search/channels" --data-urlencode "q=$Q" -d per=24 |
  jq -r '.channels | sort_by(-.length) | .[] |
    "\(.length) items | \(.title) | are.na/\(.user.slug)/\(.slug) | updated \((.updated_at // "")[0:10])"'
```

v2 has no reliable server-side sort — sort client-side. `sort_by(-.length)` surfaces the deepest collections first.

### Search users

```bash
curl -sG "https://api.are.na/v2/search/users" --data-urlencode "q=$Q" -d per=10 |
  jq -r '.users[] | "\(.slug) | \(.full_name) | \(.channel_count) channels | \(.follower_count) followers"'
```

### Search blocks — currently unavailable

`/v2/search/blocks` is blocked by Cloudflare bot protection and returns an HTML challenge page with or without a token (verified July 2026). Don't fight it — find blocks by browsing channel contents, and surface the user's own blocks with the `scope=my` search below.

### Search the user's own collections (requires token)

```bash
# Requires ARENA_READ_TOKEN — create one at https://www.are.na/developers/personal-access-tokens
curl -sG -H "Authorization: Bearer $ARENA_READ_TOKEN" "https://api.are.na/v3/search" \
  --data-urlencode "q=$Q" -d scope=my -d per=24 |
  jq -r '.data[] | "[\(.type)] \(.title // .name // "untitled") | \(.slug // .id)"'
```

`scope=my` searches the token owner's channels and blocks, including private ones — use it for "what have I saved about X?". `scope=following` searches content from people they follow. This is the one good use of v3 search; for public discovery always use v2. With the token attached, the v3 channel/block/user recipes above also return private content the user owns or collaborates on.

### Channel overview

```bash
curl -s "https://api.are.na/v3/channels/$SLUG" |
  jq '{title, slug, owner: .owner.name, counts, visibility, description: .description.plain}'
```

`counts` gives blocks/channels/contents/collaborators without fetching contents — use it to gauge depth cheaply.

### Channel contents

```bash
curl -s "https://api.are.na/v3/channels/$SLUG/contents?per=100" |
  jq -r '.data[] | "\(.id) [\(.type)] \(.title // "untitled") | \(.source.url // "")"'
```

One page is at most 100 items. For deeper channels, repeat with `&page=2`, `3`, … while `.meta.has_more_pages` is true (`.meta.total_count` gives the size up front). Page through up to ~500 items; past that, read the first five pages and say in the briefing how much of the channel you actually read.

The `type` query param is ignored by the server — filter client-side with jq. For only external links (the most valuable for deep-dives):

```bash
... | jq -r '.data[] | select(.type == "Link") | "\(.id) \(.title // "untitled") | \(.source.url)"'
```

For notes and original writing: `select(.type == "Text") | .content.plain`. Nested items with `type == "Channel"` are sub-collections worth exploring.

### Channel connections — what's adjacent to this collection

```bash
curl -s "https://api.are.na/v3/channels/$SLUG/connections?per=25" |
  jq -r '"\(.meta.total_count) connected channels",
    (.data[] | "  \(.counts.contents) items | \(.title) | are.na/\(.owner.slug)/\(.slug)")'
```

Returns channels that share blocks with this one — conceptual neighbors. A "tools for thought" channel connecting to "cybernetics" and "memex legacies" tells you how the topic sits in the broader idea-space.

### Block, and where else it lives

```bash
curl -s "https://api.are.na/v3/blocks/$ID" |
  jq '{id, type, title, description: .description.plain, source: .source.url, content: .content.plain, user: .user.name, state}'

curl -s "https://api.are.na/v3/blocks/$ID/connections?per=25" |
  jq -r '"appears in \(.meta.total_count) channels",
    (.data[] | "  \(.counts.contents) items | \(.title) | are.na/\(.owner.slug)/\(.slug)")'
```

A block in 30 channels means 30 people independently thought it was worth saving — high signal. The channels it appears in show how different people contextualize the same idea.

### User profile and their channels

```bash
curl -s "https://api.are.na/v3/users/$SLUG" | jq '{name, slug, counts, bio: .bio.plain}'

curl -s "https://api.are.na/v3/users/$SLUG/contents?per=50" |
  jq -r '.data[] | select(.type == "Channel") | "\(.counts.contents) items | \(.title) | \(.slug)"'
```

User contents mixes blocks and channels — the `select` keeps only channels.

### Citation URLs

```
Channel: https://www.are.na/{owner_slug}/{channel_slug}
Block:   https://www.are.na/block/{block_id}
User:    https://www.are.na/{user_slug}
```

## Research Loop

### Step 1: Decompose the question

Turn the topic into 3–5 channel searches from different angles: the direct terms, adjacent concepts, practitioner language (how Are.na users actually name things — "tools for thought", "digital gardens", "vernacular web"), the umbrella category, and known works or people in the space.

### Step 2: Search and assess

Run each search. Channels with 2–3 items are stubs; 50+ items is a serious collection. Note when the same user owns multiple relevant channels — they're a key curator. Pick the top 3–5 channels by depth and relevance.

### Step 3: Explore top channels

Fetch contents. Pull Link blocks (external references), Text blocks (notes and original writing), and nested channels. For visual research, Image block titles and descriptions matter; don't fetch the images themselves.

### Step 4: Follow the connection graph — one hop

For the 2–3 most interesting blocks, fetch their connections to see where else they live and who saved them. For the best channel, fetch its channel connections to find adjacent collections. **One hop is the sweet spot** — two hops gets exponential and off-topic fast.

### Step 5: Profile key curators

For users who kept appearing, fetch their profile and channel list. Their other channels often extend the topic in directions the searches missed.

### Step 6: Deep-dive the best links

WebFetch the `source.url` of Link blocks that appear in many channels or come from deep collections — prioritize essays, papers, repos, and documentation. Skip social media posts, image galleries, paywalls, and anything whose `state` isn't `available`.

### Step 7: Synthesize

Group findings by **theme**, not by search query. For each theme give: a 1–2 sentence summary of what curators are collecting and how they frame it, key channels (title, are.na URL, owner, item count), notable blocks (with connection counts and source URLs), and key curators. Close with connected territory — adjacent channels the graph surfaced — and note any gaps or searches that came up dry.

Cite everything with are.na URLs so the user can walk the same path. If the user wants the briefing saved, use the save-report skill.

## Notes

- Stay polite with the API: batch what you can into `per=100` pages and don't re-fetch what you already have. On a 429, back off until the `X-RateLimit-Reset` timestamp.
- Budget: a full research loop is roughly 25–40 requests (searches, 3–5 channels with paging, a handful of connections and profiles). Unauthenticated that's over a minute of the 30/min limit — pace the calls, or suggest `ARENA_READ_TOKEN` if the user does this often.
- Too many shallow results? Try more specific practitioner vocabulary. Too few? Broaden to the umbrella category or search for a known thinker and explore outward from their channels.
- `visibility: "closed"` channels are still readable (closed means others can't add to them); `private` channels 403 unless the request carries a token whose owner has access.
- The v3 API is labeled work-in-progress by Are.na — if a recipe fails, check the raw response shape before assuming the resource is missing.
