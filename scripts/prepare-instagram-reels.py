"""Build lightweight, silent reel previews without changing the source files."""

import json
from pathlib import Path
import shutil
import subprocess


ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        import imageio_ffmpeg

        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

    reels = json.loads((ROOT / "src/data/instagram-reels.json").read_text(encoding="utf-8"))
    output = ROOT / "public/instagram"
    output.mkdir(parents=True, exist_ok=True)
    original_total = preview_total = 0
    for reel in reels:
        source = ROOT / "Reels" / reel["sourceFile"]
        destination = ROOT / "public" / reel["video"].lstrip("/")
        poster = ROOT / "public" / reel["poster"].lstrip("/")
        if not source.is_file():
            raise FileNotFoundError(source)
        subprocess.run([
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
            "-ss", str(reel["previewStart"]), "-i", str(source),
            "-t", str(reel["previewDuration"]), "-map", "0:v:0", "-an",
            "-vf", "scale=w='min(540,iw)':h=-2:flags=lanczos,setsar=1,fps=24",
            "-c:v", "libx264", "-preset", "slow", "-crf", "26",
            "-maxrate", "950k", "-bufsize", "1900k", "-pix_fmt", "yuv420p",
            "-g", "48", "-movflags", "+faststart", "-map_metadata", "-1",
            str(destination),
        ], check=True)
        subprocess.run([
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
            "-ss", "0.5", "-i", str(destination), "-frames:v", "1",
            "-c:v", "libwebp", "-quality", "80", str(poster),
        ], check=True)
        original_total += source.stat().st_size
        preview_total += destination.stat().st_size + poster.stat().st_size
        print(f"{reel['id']}: {source.stat().st_size:,} -> "
              f"{destination.stat().st_size:,} video + {poster.stat().st_size:,} poster bytes", flush=True)
    print(f"Total originals: {original_total:,}; previews and posters: {preview_total:,} bytes")


if __name__ == "__main__":
    main()
