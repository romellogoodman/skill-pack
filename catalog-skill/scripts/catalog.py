#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["yt-dlp", "mlx-whisper"]
# ///
"""
catalog — save an X thread or a YouTube video locally.

  catalog.py https://x.com/user/status/123   text + images + videos for the whole thread
  catalog.py https://youtu.be/abc             video + transcript
  catalog.py <x-url> --transcribe             also transcribe the thread's videos

Output goes to ./<name>/ (the current directory) unless -o is given.
X data comes from the public FxTwitter API (no login). Transcription runs
locally with mlx-whisper; the model downloads once on first use.
"""

import argparse
import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

WHISPER_MODEL = "mlx-community/whisper-large-v3-turbo"
UA = {"User-Agent": "catalog/1.0"}


def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return r.read()


def download(url, dest):
    if dest.exists():
        return dest
    dest.write_bytes(fetch(url))
    print(f"  saved {dest.name}")
    return dest


def timestamp(seconds, sep="."):
    h, rem = divmod(int(seconds), 3600)
    m, s = divmod(rem, 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{h:02}:{m:02}:{s:02}{sep}{ms:03}"


def transcribe(media, out_dir, stem="transcript"):
    import mlx_whisper

    print(f"  transcribing {media.name} (first run downloads the model)…")
    result = mlx_whisper.transcribe(str(media), path_or_hf_repo=WHISPER_MODEL)
    segments = result["segments"]

    (out_dir / f"{stem}.txt").write_text(result["text"].strip() + "\n")
    (out_dir / f"{stem}.srt").write_text(
        "\n".join(
            f"{i}\n{timestamp(s['start'], ',')} --> {timestamp(s['end'], ',')}\n{s['text'].strip()}\n"
            for i, s in enumerate(segments, 1)
        )
    )
    (out_dir / f"{stem}.md").write_text(
        "\n".join(f"**[{timestamp(s['start'])[:8]}]** {s['text'].strip()}  " for s in segments) + "\n"
    )
    print(f"  wrote {stem}.txt / .srt / .md")


# --- X -----------------------------------------------------------------------

def best_video_url(media):
    mp4s = [f for f in media.get("formats", []) if f.get("container") == "mp4"]
    if mp4s:
        return max(mp4s, key=lambda f: f.get("bitrate", 0))["url"]
    return media["url"]


def catalog_x(url, out_root, want_transcripts):
    m = re.search(r"/status(?:es)?/(\d+)", url)
    if not m:
        sys.exit("Couldn't find a status id in that URL.")
    status_id = m.group(1)

    data = json.loads(fetch(f"https://api.fxtwitter.com/2/thread/{status_id}"))
    if data.get("code") != 200:
        sys.exit(f"FxTwitter returned {data.get('code')}: {data.get('message')}")

    tweets = data.get("thread") or [data["status"]]
    author = data["status"]["author"]["screen_name"]
    out_dir = out_root / f"x-{author}-{status_id}"
    media_dir = out_dir / "media"
    media_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "thread.json").write_text(json.dumps(data, indent=2))
    print(f"X thread by @{author}: {len(tweets)} post(s) → {out_dir}")

    lines = [f"# @{author} — thread", "", f"<{url}>", ""]
    videos = []
    for n, t in enumerate(tweets, 1):
        when = datetime.fromtimestamp(t["created_timestamp"]).strftime("%Y-%m-%d %H:%M")
        lines += [f"## {n}. {when}", "", t["text"], ""]

        for i, item in enumerate((t.get("media") or {}).get("all", []), 1):
            base = f"{n:02}-{i}"
            if item["type"] == "photo":
                src = item["url"].split("?")[0]
                ext = Path(src).suffix or ".jpg"
                path = download(f"{src}?name=orig", media_dir / f"{base}{ext}")
                lines += [f"![]({path.relative_to(out_dir)})", ""]
            else:  # video or gif
                path = download(best_video_url(item), media_dir / f"{base}.mp4")
                lines += [f"[{item['type']}]({path.relative_to(out_dir)})", ""]
                if item["type"] == "video":
                    videos.append(path)

        quote = t.get("quote")
        if quote:
            lines += [f"> **@{quote['author']['screen_name']}:** " + quote["text"].replace("\n", "\n> "),
                      f"> <{quote['url']}>", ""]

        lines += [f"<{t['url']}> · {t.get('likes', 0)} likes · {t.get('reposts', 0)} reposts", ""]

    (out_dir / "thread.md").write_text("\n".join(lines))
    print("  wrote thread.md")

    if want_transcripts:
        for v in videos:
            transcribe(v, media_dir, stem=v.stem + "-transcript")


# --- YouTube -----------------------------------------------------------------

def catalog_youtube(url, out_root, want_transcript=True):
    import yt_dlp

    with yt_dlp.YoutubeDL({"quiet": True}) as ydl:
        info = ydl.extract_info(url, download=False)
    slug = re.sub(r"[^\w-]+", "-", info["title"]).strip("-")[:60]
    out_dir = out_root / f"yt-{slug}-{info['id']}"
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"YouTube: {info['title']} → {out_dir}")

    opts = {
        "outtmpl": str(out_dir / "video.%(ext)s"),
        "format": "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b",
        "merge_output_format": "mp4",
        "writethumbnail": True,
        "writeinfojson": True,
        "noplaylist": True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([url])

    video = next(out_dir.glob("video.mp4"), None) or next(out_dir.glob("video.*"))
    (out_dir / "description.md").write_text(
        f"# {info['title']}\n\n{info.get('uploader', '')} · {info.get('upload_date', '')}\n\n<{url}>\n\n"
        f"{info.get('description', '')}\n"
    )
    if want_transcript:
        transcribe(video, out_dir)


def main():
    p = argparse.ArgumentParser(description="Save an X thread or YouTube video (with transcript).")
    p.add_argument("url")
    p.add_argument("-o", "--out", type=Path, default=Path.cwd())
    p.add_argument("--transcribe", action="store_true", help="X: also transcribe videos in the thread")
    p.add_argument("--no-transcribe", action="store_true", help="YouTube: skip the transcript")
    args = p.parse_args()

    host = re.sub(r"^www\.|^m\.", "", urllib.parse.urlparse(args.url).netloc.lower())
    if host in {"x.com", "twitter.com", "fxtwitter.com", "vxtwitter.com", "fixupx.com"}:
        catalog_x(args.url, args.out, args.transcribe)
    elif host in {"youtube.com", "youtu.be", "music.youtube.com"}:
        catalog_youtube(args.url, args.out, not args.no_transcribe)
    else:
        sys.exit(f"Don't know how to catalog {host!r} — expected an x.com or youtube.com URL.")


if __name__ == "__main__":
    main()
