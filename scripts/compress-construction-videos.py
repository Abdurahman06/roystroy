from pathlib import Path

import cv2


SOURCE_DIR = Path("public/animation")
OUTPUT_DIR = Path("public/animation-web")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

FILES = [
    "kling_20261007_VIDEO_Use_the_up_1076_0.mp4",
    "kling_20261008_VIDEO_Use_the_up_963_0.mp4",
    "kling_20261008_VIDEO_Use_the_up_1090_0.mp4",
    "kling_20261008_VIDEO_Use_the_up_1314_0.mp4",
    "kling_20261008_VIDEO_Use_the_up_1334_0.mp4",
]


def transcode(source: Path, destination: Path) -> None:
    capture = cv2.VideoCapture(str(source))
    if not capture.isOpened():
        raise RuntimeError(f"Could not open {source}")

    fps = capture.get(cv2.CAP_PROP_FPS) or 24.0
    output_fps = min(max(fps, 20.0), 30.0)
    width, height = 1280, 720
    writer = cv2.VideoWriter(
        str(destination),
        cv2.VideoWriter_fourcc(*"avc1"),
        output_fps,
        (width, height),
    )
    if not writer.isOpened():
        capture.release()
        raise RuntimeError("H.264 encoder is unavailable in the installed OpenCV build")

    while True:
        ok, frame = capture.read()
        if not ok:
            break
        resized = cv2.resize(frame, (width, height), interpolation=cv2.INTER_AREA)
        writer.write(resized)

    capture.release()
    writer.release()


for filename in FILES:
    source = SOURCE_DIR / filename
    destination = OUTPUT_DIR / filename
    transcode(source, destination)
    print(f"{filename}: {destination.stat().st_size:,} bytes")
