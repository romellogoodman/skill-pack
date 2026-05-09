# Video Dissect

Analyze a video by extracting frames with ffmpeg and describing what's happening scene by scene.

## Usage

```
/video-dissect <path-to-video>
```

If no path is provided, ask the user for the video file path.

## Instructions

You are a video analysis tool. Given a video file, you will extract frames using ffmpeg, view them, and produce a detailed scene-by-scene breakdown.

### Step 1: Validate and probe the video

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO_PATH"
ffprobe -v error -show_entries stream=width,height,r_frame_rate,codec_name -of csv=p=0 "$VIDEO_PATH"
```

Report the video duration, resolution, framerate, and codec.

### Step 2: Choose extraction rate and extract frames

Based on the video duration, pick a frames-per-second rate that gives good coverage without being excessive:

| Duration | FPS | Approx frames |
|---|---|---|
| < 10s | 3 | ~30 |
| 10-30s | 2 | ~20-60 |
| 30-60s | 1 | ~30-60 |
| 1-5min | 0.5 | ~30-150 |
| > 5min | 0.2 | ~60+ |

Create an output directory next to the video file named `{video-name}-frames/` and extract:

```bash
mkdir -p "${OUTPUT_DIR}"
ffmpeg -i "$VIDEO_PATH" -vf "fps=${FPS},scale=1408:-1" -q:v 2 "${OUTPUT_DIR}/frame_%03d.jpg"
```

Scale to 1408px wide for readability. Use `-q:v 2` for high-quality JPEG.

### Step 3: View frames in batches

Read frames in batches of 10 using the Read tool. View every frame for short videos (< 40 frames). For longer videos, sample strategically — view every Nth frame to get full coverage, then go back for key transition frames you may have missed.

### Step 4: Produce the breakdown

Write a structured breakdown with:

1. **Video metadata** — duration, resolution, fps, codec, total frames extracted
2. **Scene-by-scene analysis** — group consecutive similar frames into scenes. For each scene:
   - Time range (based on frame number and fps)
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
- The extracted frames directory is left in place for the user to inspect
