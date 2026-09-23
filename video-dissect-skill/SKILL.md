---
name: video-dissect
description: Analyze a video by extracting frames with ffmpeg and producing a detailed scene-by-scene breakdown of its visual contents. Use when the user wants to dissect, summarize, or otherwise understand what a video shows — screen recordings, demos, presentations, footage.
allowed-tools: Bash(ffprobe *) Bash(ffmpeg *) Bash(mkdir *) Bash(ls *) Bash(awk *) Bash(grep *) Bash(mktemp *) Read
---

# Video Dissect

Analyze a video by extracting frames with ffmpeg and describing what's happening scene by scene.

**Visual only.** This skill reads frames, not the soundtrack — it can't transcribe speech. If the user needs what's said, tell them up front, and offer to extract the audio (`ffmpeg -i "$VIDEO_PATH" -vn -ac 1 -ar 16000 audio.wav`) for a speech-to-text tool if they have one.

## Usage

Invoked with a path to a video file. If no path is provided, ask the user for the video file path.

## Instructions

### Step 1: Validate and probe the video

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO_PATH"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,codec_name -of csv=p=0 "$VIDEO_PATH"
```

Report the video duration, resolution, framerate, and codec.

### Step 2: Pick an output directory

Use the session's scratchpad directory if one is listed in your instructions, otherwise `mktemp -d`. Don't write next to the video — that clutters the user's folders and may not be writable. Name the folder `{video-name}-frames/` and tell the user where it is; it's left in place for them to inspect.

### Step 3: Extract frames — an even sample plus the cuts

Two passes. The even sample gives coverage; the cut pass catches scene changes the sample would skip.

**Even sample, capped at ~60 frames** whatever the length — `fps = min(2, 60 / duration)`. A 20s clip gets 2 fps; an hour gets one frame a minute.

```bash
FPS=$(awk -v d="$DURATION" 'BEGIN { f = 60 / d; if (f > 2) f = 2; printf "%.4g", f }')
mkdir -p "$OUTPUT_DIR"
ffmpeg -hide_banner -loglevel error -i "$VIDEO_PATH" \
  -vf "fps=${FPS},scale='min(1408,iw)':-2" -q:v 2 "$OUTPUT_DIR/frame_%04d.jpg"
```

Frame `n` is at roughly `(n - 1) / FPS` seconds. `scale='min(1408,iw)':-2` caps width at 1408px for legibility without upscaling small videos.

**Scene cuts**, with their timestamps:

```bash
ffmpeg -hide_banner -i "$VIDEO_PATH" \
  -vf "select='gt(scene,0.3)',showinfo,scale='min(1408,iw)':-2" -fps_mode vfr -q:v 2 \
  "$OUTPUT_DIR/cut_%04d.jpg" 2>&1 | grep -o 'pts_time:[0-9.]*'
```

The printed `pts_time` values are the cut times in seconds, in order (`cut_0001.jpg` is the first). More than ~40 cuts — fast editing, noisy footage — rerun with `0.5`; none on a video that clearly has cuts, try `0.2`. Screen recordings with small UI changes often register no cuts at all; the even sample covers them.

### Step 4: View frames

Read frames in batches of 10 using the Read tool. Read every cut frame, and every sample frame for short videos (< 40 frames). For longer videos, read every Nth sample frame for coverage, then go back to the frames either side of anything that changed.

### Step 5: Produce the breakdown

Write a structured breakdown with:

1. **Video metadata** — duration, resolution, fps, codec, frames extracted (sample + cuts)
2. **Scene-by-scene analysis** — group consecutive similar frames into scenes, bounded by the cut times where there are cuts. For each scene:
   - Time range
   - What's visible on screen
   - Any text, UI elements, data, or interactions shown
   - What changed from the previous scene
3. **Key content extracted** — any readable text, data tables, code, URLs, or other structured information visible in the frames. Reproduce these in full where possible.
4. **Summary** — a concise description of what the video shows overall

### Notes

- If the video has scene transitions (cuts, fades, new screens), call those out as distinct scenes
- For screen recordings: capture UI elements, app names, button labels, any typed text
- For presentations: capture slide titles and key bullet points
- For dashboards/data: reproduce charts, tables, and metrics as markdown
- If a frame is blurry or transitional, note that and move on
- Say what you couldn't see: with a one-frame-a-minute sample, brief moments between frames are missed — offer a denser pass over a specific time range (`-ss START -to END` before `-i`) if the user needs one
