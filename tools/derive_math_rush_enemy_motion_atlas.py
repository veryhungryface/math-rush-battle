from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "apps/web/public/math-rush-battle-v2/assets"
OUT = ASSET_DIR / "enemy-motion-atlas-v1.png"

FRAME = 256
COLS = 8
FRAMES_PER_ENEMY = 4

SOURCE_REFS = [
    ("runner-extra-atlas-v3.png", 0),
    ("runner-extra-atlas-v3.png", 1),
    ("runner-extra-atlas-v3.png", 2),
    ("runner-extra-atlas-v3.png", 3),
    ("runner-extra-atlas-v3.png", 4),
    ("runner-extra-atlas-v3.png", 5),
    ("runner-extra-atlas-v3.png", 6),
    ("runner-extra-atlas-v3.png", 7),
    ("runner-battle-atlas-v2.png", 4),
    ("runner-battle-atlas-v2.png", 5),
    ("runner-battle-atlas-v2.png", 6),
    ("runner-battle-atlas-v2.png", 7),
]

MOTION = [
    {"angle": -1.6, "scale_x": 1.0, "scale_y": 1.0, "x": -2, "y": 2},
    {"angle": 2.2, "scale_x": 0.965, "scale_y": 1.035, "x": 2, "y": -5},
    {"angle": 0.8, "scale_x": 1.035, "scale_y": 0.975, "x": 1, "y": 1},
    {"angle": -2.4, "scale_x": 0.985, "scale_y": 1.025, "x": -1, "y": -3},
]


def crop_frame(sheet: Image.Image, index: int) -> Image.Image:
    cols = sheet.width // FRAME
    x = (index % cols) * FRAME
    y = (index // cols) * FRAME
    return sheet.crop((x, y, x + FRAME, y + FRAME)).convert("RGBA")


def make_motion_frame(source: Image.Image, motion: dict[str, float]) -> Image.Image:
    scaled_w = int(FRAME * motion["scale_x"])
    scaled_h = int(FRAME * motion["scale_y"])
    scaled = source.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
    rotated = scaled.rotate(motion["angle"], resample=Image.Resampling.BICUBIC, expand=True)
    frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    x = int((FRAME - rotated.width) / 2 + motion["x"])
    y = int((FRAME - rotated.height) / 2 + motion["y"])
    frame.alpha_composite(rotated, (x, y))
    return frame


def main() -> None:
    rows = (len(SOURCE_REFS) * FRAMES_PER_ENEMY + COLS - 1) // COLS
    atlas = Image.new("RGBA", (COLS * FRAME, rows * FRAME), (0, 0, 0, 0))
    cache: dict[str, Image.Image] = {}

    for enemy_index, (filename, source_frame) in enumerate(SOURCE_REFS):
        if filename not in cache:
            cache[filename] = Image.open(ASSET_DIR / filename).convert("RGBA")
        source = crop_frame(cache[filename], source_frame)
        for motion_index, motion in enumerate(MOTION):
            output_index = enemy_index * FRAMES_PER_ENEMY + motion_index
            x = (output_index % COLS) * FRAME
            y = (output_index // COLS) * FRAME
            atlas.alpha_composite(make_motion_frame(source, motion), (x, y))

    atlas.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
