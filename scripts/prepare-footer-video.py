"""Create a small, seamless ambient loop from the finished villa footage."""

from pathlib import Path
import shutil
import subprocess


ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        import imageio_ffmpeg

        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

    output = ROOT / "public" / "footer"
    output.mkdir(parents=True, exist_ok=True)
    # Use only the finished house. Reversing this quiet tail avoids a hard cut
    # or a jump back to construction; the original intro clips stay untouched.
    filters = (
        "[0:v]trim=start=3.25:end=5,setpts=2*(PTS-STARTPTS),"
        "scale=1280:-2:flags=lanczos,setsar=1,fps=24,split[a][b];"
        "[b]reverse[r];[a][r]concat=n=2:v=1:a=0,format=yuv420p[v]"
    )
    subprocess.run([
        ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(ROOT / "animation" / "new" / "new5.mp4"),
        "-filter_complex", filters, "-map", "[v]", "-an",
        "-c:v", "libx264", "-preset", "slow", "-crf", "25",
        "-g", "48", "-movflags", "+faststart",
        str(output / "villa-loop.mp4"),
    ], check=True)
    subprocess.run([
        ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(output / "villa-loop.mp4"), "-frames:v", "1",
        "-c:v", "libwebp", "-quality", "82",
        str(output / "villa-poster.webp"),
    ], check=True)
    for path in output.iterdir():
        print(f"{path.name}: {path.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
