---
name: catalog
description: Save an X (Twitter) thread or a YouTube video to disk — the thread's text, images and videos, or the video plus a local Whisper transcript. Use when the user gives an x.com / twitter.com / youtube.com / youtu.be link and wants it downloaded, archived, saved, or transcribed, or mentions /catalog.
argument-hint: "<x-or-youtube-url> [--transcribe]"
allowed-tools: Bash(uv *) Bash(ls *) Read
---

# Catalog

Archive an X thread or a YouTube video locally with one script:
`<this skill's directory>/scripts/catalog.py`. It's a uv inline script, so
its dependencies (yt-dlp, mlx-whisper) install themselves on the first run.
It needs `uv` and `ffmpeg` on the PATH, plus Apple Silicon for mlx-whisper.

`$ARGUMENTS` is the URL plus any flags. If it has no URL, ask for one.

## Run it

```bash
uv run --script <this skill's directory>/scripts/catalog.py "$URL" [flags]
```

| Flag | Effect |
| --- | --- |
| `-o DIR` | Output root. Default `~/Downloads/catalog/` |
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

## After it runs

Tell the user the output folder and what's in it: the number of posts and
media files, or the video's length and transcript size. Then offer the
natural next step: a summary of the thread or transcript (Read the `.md`
file), or a scene-by-scene look at a downloaded video with the
`video-dissect` skill. Don't summarize unless they ask. They may only have
wanted the files.

## Limits

- X data comes from the public FxTwitter API (`api.fxtwitter.com/2/thread/<id>`), so no login is needed. It covers only the author's own thread, not replies from other people. Protected accounts and deleted posts fail. If the API is down, say so. Don't fall back to scraping x.com.
- A YouTube playlist URL saves only the one video (`noplaylist`).
- If yt-dlp fails with a signature, format or 403 error, YouTube has probably changed something. Retry with `uv run --refresh-package yt-dlp --script …` to pull the latest yt-dlp.
