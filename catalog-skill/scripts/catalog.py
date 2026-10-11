#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["yt-dlp", "mlx-whisper", "markdownify", "beautifulsoup4"]
# ///
"""
catalog — save an X thread, a YouTube video or a Substack post locally.

  catalog.py https://x.com/user/status/123   text + images + videos for the whole thread
  catalog.py https://youtu.be/abc             video + transcript
  catalog.py https://pub.substack.com/p/slug  post as markdown + its images
  catalog.py <x-url> --transcribe             also transcribe the thread's videos

Output goes to ./<name>/ (the current directory) unless -o is given.
X data comes from the public FxTwitter API and Substack posts from the
publication's own post API (no login for either). Transcription runs
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


# --- Substack ----------------------------------------------------------------

def substack_api_url(url):
    """Map any Substack post link to its post API endpoint."""
    u = urllib.parse.urlparse(url)
    host = u.netloc.lower()
    # substack.com/home/post/p-123, substack.com/@user/p-123 (app links)
    m = re.search(r"/p-(\d+)", u.path)
    if host.endswith("substack.com") and m:
        return f"https://substack.com/api/v1/posts/by-id/{m.group(1)}"
    # open.substack.com/pub/<pub>/p/<slug> (share links)
    m = re.match(r"/pub/([^/]+)/p/([^/]+)", u.path)
    if m:
        return f"https://{m.group(1)}.substack.com/api/v1/posts/{m.group(2)}"
    # <pub>.substack.com/p/<slug>, or a custom domain
    m = re.match(r"/p/([^/]+)", u.path)
    if m:
        return f"https://{host}/api/v1/posts/{m.group(1)}"
    return None


def original_image_url(src):
    # substackcdn.com/image/fetch/<transforms>/<url-encoded original>
    m = re.search(r"/image/fetch/[^/]*/(https?%3A.+)$", src)
    return urllib.parse.unquote(m.group(1)) if m else src


def catalog_substack(url, out_root):
    from bs4 import BeautifulSoup
    from markdownify import markdownify

    api = substack_api_url(url)
    if not api:
        sys.exit("Couldn't find a post in that Substack URL (expected /p/<slug>).")
    try:
        data = json.loads(fetch(api))
    except Exception as e:
        sys.exit(f"Substack post API failed ({api}): {e}")
    post = data.get("post", data)  # the by-id endpoint wraps the post

    body = post.get("body_html") or ""
    if len(body.strip()) < 40:
        sys.exit(f"No usable body for this post (audience={post.get('audience')}); it may be paywalled.")

    canonical = post.get("canonical_url") or url
    pub = urllib.parse.urlparse(canonical).netloc.split(".")[0]
    out_dir = out_root / f"substack-{pub}-{post['slug']}"
    media_dir = out_dir / "media"
    media_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "post.json").write_text(json.dumps(data, indent=2))
    print(f"Substack: {post['title']} → {out_dir}")
    if post.get("audience") != "everyone":
        print(f"  note: audience is {post.get('audience')!r}, so the body may be a preview")

    soup = BeautifulSoup(body, "html.parser")
    for tag in soup(["button", "svg", "source", "script", "style"]):
        tag.decompose()
    for a in soup.select("a.image-link"):  # Substack wraps each image in a link to itself
        a.unwrap()
    for i, img in enumerate(soup.find_all("img"), 1):
        cdn = img.get("src", "")
        if not cdn:
            continue
        src = original_image_url(cdn)
        dest = media_dir / f"{i:02}{Path(urllib.parse.urlparse(src).path).suffix or '.jpg'}"
        for candidate in dict.fromkeys([src, cdn]):  # older posts' buckets 403, so fall back to the CDN copy
            try:
                img["src"] = str(download(candidate, dest).relative_to(out_dir))
                break
            except Exception as e:
                err = e
        else:
            print(f"  ! couldn't save image {i}: {err}")
            img["src"] = src
        for attr in ("srcset", "width", "height", "class", "data-attrs"):
            img.attrs.pop(attr, None)

    bylines = ", ".join(b["name"] for b in post.get("publishedBylines") or [])
    header = [f"# {post['title']}", ""]
    if post.get("subtitle"):
        header += [f"*{post['subtitle']}*", ""]
    header += [" · ".join(x for x in (bylines, (post.get("post_date") or "")[:10]) if x), "", f"<{canonical}>", ""]
    md = markdownify(str(soup), heading_style="ATX", bullets="-")
    md = re.sub(r"\n{3,}", "\n\n", md).strip()
    (out_dir / "post.md").write_text("\n".join(header) + "\n" + md + "\n")
    print("  wrote post.md")


def main():
    p = argparse.ArgumentParser(description="Save an X thread, YouTube video (with transcript) or Substack post.")
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
    elif host.endswith("substack.com") or substack_api_url(args.url):
        catalog_substack(args.url, args.out)  # /p/<slug> on another host: try it as a custom domain
    else:
        sys.exit(f"Don't know how to catalog {host!r} — expected an x.com, youtube.com or Substack URL.")


if __name__ == "__main__":
    main()
