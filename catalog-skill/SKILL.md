---
name: catalog
description: Save an X (Twitter) thread, a YouTube video or a Substack post to disk — the thread's text, images and videos, the video plus a local Whisper transcript, or the post as markdown with its images. Use when the user gives an x.com / twitter.com / youtube.com / youtu.be / substack.com link (or a Substack post on a custom domain) and wants it downloaded, archived, saved, or transcribed, or mentions /catalog.
argument-hint: "<x-youtube-or-substack-url> [--transcribe]"
allowed-tools: Bash(uv *) Bash(ls *) Read
---

# Catalog

Archive an X thread, a YouTube video or a Substack post locally with one script:
`<this skill's directory>/scripts/catalog.py`. It's a uv inline script, so
its dependencies (yt-dlp, mlx-whisper, markdownify) install themselves on the first run.
It needs `uv` and `ffmpeg` on the PATH, plus Apple Silicon for mlx-whisper.

`$ARGUMENTS` is the URL plus any flags. If it has no URL, ask for one.

## Run it

```bash
uv run --script <this skill's directory>/scripts/catalog.py "$URL" [flags]
```

| Flag | Effect |
| --- | --- |
| `-o DIR` | Output root. Default: the current directory |
| `--transcribe` | X only: also transcribe each video in the thread |
| `--no-transcribe` | YouTube only: skip the transcript |

Transcription runs on the local machine (`whisper-large-v3-turbo`). The
first run downloads about 1.6 GB of model weights, and a long video can take
a few minutes. Run it in the background for anything over about 20 minutes,
and tell the user it's working.

## What it writes

**X**: `x-<user>-<status id>/`
- `thread.md`: each post in the author's own thread (their chain of replies to themselves), in order, with dates, quoted posts, like/repost counts, and links to the media
- `thread.json`: raw FxTwitter API response
- `media/NN-i.jpg|png|mp4`: photos at full size, videos at the highest-bitrate mp4; `NN-i-transcript.*` next to each video when you pass `--transcribe`

**YouTube**: `yt-<title>-<video id>/`
- `video.mp4`, the thumbnail (`video.webp`), `video.info.json`
- `description.md`: title, uploader, date, URL, description
- `transcript.txt` (plain), `transcript.srt`, `transcript.md` (one `**[hh:mm:ss]**` line per segment)

**Substack**: `substack-<publication>-<slug>/`
- `post.md`: title, subtitle, author, date, URL, then the body converted to markdown
- `post.json`: raw post API response
- `media/NN.jpg|png|…`: each image in the post at original size, linked from `post.md`

## After it runs

Tell the user the output folder and what's in it: the number of posts and
media files, the video's length and transcript size, or the post's title and image count. Then offer the
natural next step: a summary of the thread or transcript (Read the `.md`
file), or a scene-by-scene look at a downloaded video with the
`video-dissect` skill. Don't summarize unless they ask. They may only have
wanted the files.

## Limits

- X data comes from the public FxTwitter API (`api.fxtwitter.com/2/thread/<id>`), so no login is needed. It covers only the author's own thread, not replies from other people. Protected accounts and deleted posts fail. If the API is down, say so. Don't fall back to scraping x.com.
- Substack data comes from the publication's post API (`<pub>/api/v1/posts/<slug>`, or `substack.com/api/v1/posts/by-id/<id>` for `substack.com/home/post/p-<id>` app links), so no login is needed. It accepts `<pub>.substack.com/p/<slug>`, `open.substack.com/pub/<pub>/p/<slug>` share links, app links, and any other `/p/<slug>` URL as a custom-domain publication. Paid posts return only the free preview: the script warns when a post isn't public, and fails if there's no body at all. Podcast audio and embedded video aren't downloaded.
- A YouTube playlist URL saves only the one video (`noplaylist`).
- If yt-dlp fails with a signature, format or 403 error, YouTube has probably changed something. Retry with `uv run --refresh-package yt-dlp --script …` to pull the latest yt-dlp.
