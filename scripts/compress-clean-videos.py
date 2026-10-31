"""Encode construction clips for scroll seeking (pip install imageio-ffmpeg)."""

from pathlib import Path
import shutil
import subprocess


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "animation" / "new"
OUTPUT_DIR = ROOT / "public" / "animation-web" / "clean-v1"


def main() -> None:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        import imageio_ffmpeg

        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

    sources = [SOURCE_DIR / f"new{index}.mp4" for index in range(1, 6)]
    for source in sources:
        if not source.is_file():
            raise FileNotFoundError(source)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    original_total = 0
    encoded_total = 0
    for index, source in enumerate(sources, start=1):
        destination = OUTPUT_DIR / f"stage-{index}.mp4"
        # Short closed GOPs and no B-frames reduce random-seek decode work.
        # Preserve source cadence and aspect ratio; do not crop or trim stages.
        subprocess.run([
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(source), "-map", "0:v:0", "-an",
            "-vf", "scale=w='min(1280,iw)':h=-2:flags=lanczos,setsar=1",
            "-c:v", "libx264", "-preset", "slow", "-crf", "24",
            "-pix_fmt", "yuv420p", "-g", "12", "-keyint_min", "12",
            "-sc_threshold", "0", "-bf", "0", "-flags", "+cgop",
            "-movflags", "+faststart", "-map_metadata", "-1",
            str(destination),
        ], check=True)
        subprocess.run([
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(destination), "-frames:v", "1", "-q:v", "3",
            str(OUTPUT_DIR / f"stage-{index}.jpg"),
        ], check=True)
        original_total += source.stat().st_size
        encoded_total += destination.stat().st_size
        print(f"{source.name}: {source.stat().st_size:,} -> {destination.stat().st_size:,} bytes", flush=True)

    print(f"Total: {original_total:,} -> {encoded_total:,} bytes ({1 - encoded_total / original_total:.1%} smaller)")


if __name__ == "__main__":
    main()
