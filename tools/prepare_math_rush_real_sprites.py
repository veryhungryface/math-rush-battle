from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "apps/web/public/math-rush-battle-v2/assets"
FRAME = 256
ROWS = 4
COLS = 4


def magenta_to_alpha(image: Image.Image) -> Image.Image:
    source = image.convert("RGBA")
    pixels = source.load()
    for y in range(source.height):
        for x in range(source.width):
            r, g, b, a = pixels[x, y]
            is_key = r > 210 and b > 210 and g < 95 and abs(r - b) < 70
            is_edge_key = r > 175 and b > 175 and g < 145 and r + b - g * 2 > 210
            if is_key:
                pixels[x, y] = (r, g, b, 0)
            elif is_edge_key:
                alpha = max(0, min(255, int((g - 65) * 3.6)))
                pixels[x, y] = (min(r, 210), g, min(b, 210), min(a, alpha))
    return source


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    return image.getchannel("A").getbbox()


def normalize_grid(raw_path: Path, out_path: Path, max_body: int, bottom_pad: int) -> None:
    raw = magenta_to_alpha(Image.open(raw_path))
    cells: list[list[Image.Image]] = []
    bboxes: list[list[tuple[int, int, int, int] | None]] = []

    for row in range(ROWS):
        cell_row: list[Image.Image] = []
        bbox_row: list[tuple[int, int, int, int] | None] = []
        for col in range(COLS):
            x0 = round(raw.width * col / COLS)
            y0 = round(raw.height * row / ROWS)
            x1 = round(raw.width * (col + 1) / COLS)
            y1 = round(raw.height * (row + 1) / ROWS)
            cell = raw.crop((x0, y0, x1, y1))
            bbox = alpha_bbox(cell)
            cell_row.append(cell)
            bbox_row.append(bbox)
        cells.append(cell_row)
        bboxes.append(bbox_row)

    output = Image.new("RGBA", (COLS * FRAME, ROWS * FRAME), (0, 0, 0, 0))
    for row in range(ROWS):
        extents = [
            (bbox[2] - bbox[0], bbox[3] - bbox[1])
            for bbox in bboxes[row]
            if bbox is not None
        ]
        if not extents:
            continue
        max_w = max(width for width, _ in extents)
        max_h = max(height for _, height in extents)
        scale = min(max_body / max(max_w, 1), max_body / max(max_h, 1), 1.25)

        for col in range(COLS):
            bbox = bboxes[row][col]
            if bbox is None:
                continue
            subject = cells[row][col].crop(bbox)
            new_size = (
                max(1, round(subject.width * scale)),
                max(1, round(subject.height * scale))
            )
            subject = subject.resize(new_size, Image.Resampling.LANCZOS)
            x = col * FRAME + (FRAME - subject.width) // 2
            y = row * FRAME + FRAME - bottom_pad - subject.height
            output.alpha_composite(subject, (x, y))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    output.save(out_path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--hero-raw", required=True, type=Path)
    parser.add_argument("--enemy-raw", required=True, type=Path)
    parser.add_argument("--hero-out", type=Path, default=ASSET_DIR / "hero-run-shoot-sheet-v1.png")
    parser.add_argument("--enemy-out", type=Path, default=ASSET_DIR / "enemy-walk-sheet-v1.png")
    args = parser.parse_args()

    normalize_grid(args.hero_raw, args.hero_out, max_body=218, bottom_pad=18)
    normalize_grid(args.enemy_raw, args.enemy_out, max_body=226, bottom_pad=16)
    print(args.hero_out)
    print(args.enemy_out)


if __name__ == "__main__":
    main()
