from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "apps/web/public/math-rush-battle-v2/assets/road-bg-v2.png"
OUT = ROOT / "apps/web/public/math-rush-battle-v2/assets/road-bg-v3.png"

W, H = 1920, 1080

ROAD = {
    "top_y": 0.235,
    "bottom_y": 0.985,
    "top_left": 0.442,
    "top_right": 0.558,
    "bottom_left": -0.018,
    "bottom_right": 1.018,
}


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def road_edges(y: float) -> tuple[float, float]:
    top_y = H * ROAD["top_y"]
    bottom_y = H * ROAD["bottom_y"]
    t = max(0, min(1, (y - top_y) / (bottom_y - top_y)))
    left = lerp(W * ROAD["top_left"], W * ROAD["bottom_left"], t)
    right = lerp(W * ROAD["top_right"], W * ROAD["bottom_right"], t)
    return left, right


def point_at(position: float, y: float) -> tuple[float, float]:
    left, right = road_edges(y)
    return lerp(left, right, position), y


def line_points(position: float, start_y: float, end_y: float, steps: int = 44) -> list[tuple[float, float]]:
    return [point_at(position, lerp(start_y, end_y, i / (steps - 1))) for i in range(steps)]


def draw_polyline(draw: ImageDraw.ImageDraw, points: list[tuple[float, float]], fill, width: int) -> None:
    draw.line([(round(x), round(y)) for x, y in points], fill=fill, width=width, joint="curve")


def road_polygon() -> list[tuple[int, int]]:
    top_y = H * ROAD["top_y"]
    bottom_y = H * ROAD["bottom_y"]
    top_l, top_r = road_edges(top_y)
    bottom_l, bottom_r = road_edges(bottom_y)
    return [(round(top_l), round(top_y)), (round(top_r), round(top_y)), (round(bottom_r), round(bottom_y)), (round(bottom_l), round(bottom_y))]


def shoulder_polygon(side: str) -> list[tuple[int, int]]:
    top_y = H * ROAD["top_y"]
    bottom_y = H * ROAD["bottom_y"]
    top_l, top_r = road_edges(top_y)
    bottom_l, bottom_r = road_edges(bottom_y)
    if side == "left":
        return [
            (round(top_l - W * 0.03), round(top_y + 3)),
            (round(top_l), round(top_y)),
            (round(bottom_l), round(bottom_y)),
            (round(bottom_l - W * 0.055), round(bottom_y)),
        ]
    return [
        (round(top_r), round(top_y)),
        (round(top_r + W * 0.03), round(top_y + 3)),
        (round(bottom_r + W * 0.055), round(bottom_y)),
        (round(bottom_r), round(bottom_y)),
    ]


def depth_width(y: float, near: float, far: float) -> int:
    top_y = H * ROAD["top_y"]
    bottom_y = H * ROAD["bottom_y"]
    t = max(0, min(1, (y - top_y) / (bottom_y - top_y)))
    return max(1, round(lerp(far, near, t)))


def generate() -> None:
    random.seed(1407)
    base = Image.open(SOURCE).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
    road_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    mask = Image.new("L", (W, H), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.polygon(road_polygon(), fill=255)

    # Soften the old road under the newly aligned road so only one perspective grid remains.
    haze = Image.new("RGBA", (W, H), (86, 99, 116, 90))
    base = Image.composite(Image.alpha_composite(base, haze), base, mask.filter(ImageFilter.GaussianBlur(3)))

    road_draw = ImageDraw.Draw(road_layer, "RGBA")
    road_draw.polygon(road_polygon(), fill=(94, 103, 121, 255))

    # Vertical shading stripes create a soft 3D runner-road surface without fighting the lane math.
    for y in range(round(H * ROAD["top_y"]), round(H * ROAD["bottom_y"]) + 1):
        left, right = road_edges(y)
        t = max(0, min(1, (y - H * ROAD["top_y"]) / (H * ROAD["bottom_y"] - H * ROAD["top_y"])))
        center = (left + right) * 0.5
        width = max(1, right - left)
        shade = int(lerp(14, -10, t))
        color = (112 + shade, 121 + shade, 139 + shade, 72)
        road_draw.line((left, y, right, y), fill=color, width=1)
        road_draw.line((center - width * 0.08, y, center + width * 0.08, y), fill=(152, 160, 176, round(lerp(10, 28, t))), width=1)

    # Shoulders and edge shadows cover the older mismatched road shoulders.
    road_draw.polygon(shoulder_polygon("left"), fill=(64, 75, 91, 245))
    road_draw.polygon(shoulder_polygon("right"), fill=(64, 75, 91, 245))

    top_y = H * ROAD["top_y"]
    bottom_y = H * ROAD["bottom_y"]

    # Main white road edges.
    for pos in (0.018, 0.982):
        draw_polyline(road_draw, line_points(pos, top_y + 4, bottom_y - 4), (238, 244, 249, 235), 8)
        draw_polyline(road_draw, line_points(pos, top_y + 4, bottom_y - 4), (135, 150, 166, 70), 18)

    # Three-lane guide lines, generated from the same coordinates used by Phaser.
    for pos in (1 / 3, 2 / 3):
        for seg in range(12):
            a = seg / 12
            b = min(1, a + 0.5 / 12)
            y1 = lerp(top_y + 10, bottom_y - 34, a)
            y2 = lerp(top_y + 10, bottom_y - 34, b)
            width = depth_width((y1 + y2) * 0.5, 7, 2)
            draw_polyline(road_draw, line_points(pos, y1, y2, 10), (218, 228, 238, 118), width)

    # Center road dash for speed/runner feeling.
    for seg in range(9):
        a = seg / 9
        b = min(1, a + 0.35 / 9)
        y1 = lerp(top_y + 8, bottom_y - 42, a)
        y2 = lerp(top_y + 8, bottom_y - 42, b)
        width = depth_width((y1 + y2) * 0.5, 16, 3)
        draw_polyline(road_draw, line_points(0.5, y1, y2, 10), (255, 255, 255, 185), width)

    # Aligned guardrails and posts.
    for side, pos, rail_offset in (("left", 0.0, -0.055), ("right", 1.0, 0.055)):
        rail_a = [point_at(pos + rail_offset * 0.55, y) for y in [lerp(top_y + 10, bottom_y - 22, i / 42) for i in range(43)]]
        rail_b = [point_at(pos + rail_offset, y) for y in [lerp(top_y + 22, bottom_y - 8, i / 42) for i in range(43)]]
        draw_polyline(road_draw, rail_b, (47, 61, 83, 230), 9)
        draw_polyline(road_draw, rail_a, (105, 122, 148, 235), 8)
        draw_polyline(road_draw, rail_a, (185, 198, 218, 80), 3)

        for i in range(10):
            y = lerp(top_y + 34, bottom_y - 78, (i + 0.1) / 9.8)
            t = max(0, min(1, (y - top_y) / (bottom_y - top_y)))
            x, _ = point_at(pos + rail_offset * 0.78, y)
            post_w = lerp(7, 34, t)
            post_h = lerp(16, 64, t)
            road_draw.rounded_rectangle(
                (x - post_w / 2, y - post_h * 0.65, x + post_w / 2, y + post_h * 0.35),
                radius=max(2, int(post_w * 0.22)),
                fill=(86, 101, 125, 242),
            )
            if t > 0.7:
                road_draw.rectangle(
                    (x - post_w * 0.42, y - post_h * 0.12, x + post_w * 0.42, y + post_h * 0.2),
                    fill=(255, 195, 50, 190),
                )

    # Road surface details.
    for i in range(105):
        y = random.uniform(top_y + 80, bottom_y - 70)
        x_left, x_right = road_edges(y)
        x = random.uniform(x_left + 50, x_right - 50)
        t = max(0, min(1, (y - top_y) / (bottom_y - top_y)))
        r = random.uniform(2, 8) * lerp(0.4, 1.3, t)
        alpha = random.randint(18, 46)
        road_draw.ellipse((x - r, y - r * 0.45, x + r, y + r * 0.45), fill=(42, 48, 60, alpha))

    for i in range(18):
        y = random.uniform(top_y + 150, bottom_y - 110)
        x_left, x_right = road_edges(y)
        x = random.uniform(x_left + 80, x_right - 80)
        length = random.uniform(35, 120)
        amp = random.uniform(4, 16)
        points = []
        for j in range(8):
            points.append((x + length * j / 7, y + math.sin(j * 1.3 + i) * amp * 0.35))
        road_draw.line(points, fill=(43, 49, 60, 42), width=random.randint(2, 4))

    # Distant lip and speed haze.
    top_l, top_r = road_edges(top_y)
    road_draw.rounded_rectangle((top_l - 18, top_y - 10, top_r + 18, top_y + 10), radius=7, fill=(126, 137, 154, 190))
    road_draw.rectangle((0, 0, W, round(top_y + 8)), fill=(255, 255, 255, 10))

    composed = Image.alpha_composite(base, road_layer)

    # Friendly classroom-game polish: gentle vignette, no text baked into the image.
    vignette = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vignette)
    vd.rectangle((0, 0, W, H), fill=0)
    for i in range(130):
        alpha = int(64 * (i / 129) ** 1.7)
        vd.rectangle((i, i, W - i, H - i), outline=alpha)
    dark = Image.new("RGBA", (W, H), (10, 18, 32, 22))
    composed = Image.composite(dark, composed, vignette.filter(ImageFilter.GaussianBlur(18)))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    composed.convert("RGB").save(OUT, quality=96)


if __name__ == "__main__":
    generate()
