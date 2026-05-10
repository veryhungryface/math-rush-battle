from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "apps/web/public/math-rush-battle-v2/assets/runner-combat-atlas-v4.png"
FRAMES = ROOT / "apps/web/public/math-rush-battle-v2/assets/combat-frames"

SIZE = 256
COLS = 7
ROWS = 4


def rgba(color: tuple[int, int, int], alpha: int = 255) -> tuple[int, int, int, int]:
    return (*color, alpha)


def new_frame() -> Image.Image:
    return Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))


def shadow(draw: ImageDraw.ImageDraw, x: int = 128, y: int = 210, w: int = 132, h: int = 25) -> None:
    draw.ellipse((x - w // 2, y - h // 2, x + w // 2, y + h // 2), fill=(0, 0, 0, 46))


def outline_ellipse(draw: ImageDraw.ImageDraw, box, fill, outline=(44, 35, 36), width: int = 7) -> None:
    draw.ellipse(box, fill=outline)
    inset = width
    draw.ellipse((box[0] + inset, box[1] + inset, box[2] - inset, box[3] - inset), fill=fill)


def outline_round(draw: ImageDraw.ImageDraw, box, radius: int, fill, outline=(44, 35, 36), width: int = 7) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=outline)
    inset = width
    draw.rounded_rectangle((box[0] + inset, box[1] + inset, box[2] - inset, box[3] - inset), radius=max(1, radius - inset), fill=fill)


def shine(draw: ImageDraw.ImageDraw, box, alpha: int = 90) -> None:
    x1, y1, x2, y2 = box
    draw.ellipse((x1 + (x2 - x1) * 0.12, y1 + (y2 - y1) * 0.12, x1 + (x2 - x1) * 0.45, y1 + (y2 - y1) * 0.38), fill=(255, 255, 255, alpha))


def draw_eye_pair(draw: ImageDraw.ImageDraw, y: int, color=(255, 244, 92), angry: bool = False) -> None:
    for x in (103, 153):
        draw.ellipse((x - 16, y - 12, x + 16, y + 12), fill=(20, 24, 36, 255))
        draw.ellipse((x - 9, y - 7, x + 9, y + 7), fill=rgba(color))
    if angry:
        draw.line((86, y - 22, 119, y - 12), fill=(34, 28, 30, 255), width=8)
        draw.line((170, y - 22, 137, y - 12), fill=(34, 28, 30, 255), width=8)


def frame_robot() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    shadow(draw)
    outline_round(draw, (70, 58, 186, 190), 28, (114, 127, 145, 255), width=8)
    outline_round(draw, (88, 36, 168, 91), 18, (148, 164, 182, 255), width=7)
    draw_eye_pair(draw, 65, angry=True)
    for x in (58, 198):
        outline_ellipse(draw, (x - 26, 112, x + 26, 166), (90, 105, 128, 255), width=6)
    for x in (91, 165):
        outline_round(draw, (x - 18, 178, x + 18, 220), 11, (83, 95, 115, 255), width=5)
    shine(draw, (70, 58, 186, 190))
    return img


def frame_crab() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    shadow(draw, w=152)
    outline_ellipse(draw, (67, 89, 189, 190), (240, 91, 50, 255), width=8)
    for x, flip in ((52, -1), (204, 1)):
        outline_ellipse(draw, (x - 28, 72, x + 22, 124), (255, 133, 66, 255), width=6)
        draw.polygon([(x + flip * 4, 85), (x + flip * 48, 55), (x + flip * 34, 103)], fill=(63, 40, 37, 255))
        draw.polygon([(x + flip * 8, 87), (x + flip * 36, 67), (x + flip * 28, 97)], fill=(255, 160, 72, 255))
    draw_eye_pair(draw, 111, color=(255, 247, 118), angry=True)
    for lx in (84, 112, 144, 172):
        draw.line((lx, 180, lx - 18, 213), fill=(66, 43, 38, 255), width=10)
        draw.line((lx, 180, lx - 18, 213), fill=(255, 135, 62, 255), width=5)
    shine(draw, (67, 89, 189, 190), 70)
    return img


def frame_slime() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    shadow(draw, w=132)
    outline_ellipse(draw, (59, 72, 197, 196), (103, 222, 72, 255), width=8)
    draw.pieslice((86, 30, 142, 88), 190, 348, fill=(54, 145, 67, 255))
    draw.pieslice((113, 30, 170, 89), 200, 350, fill=(64, 168, 70, 255))
    draw_eye_pair(draw, 113, color=(255, 255, 228), angry=False)
    draw.arc((93, 124, 162, 166), 15, 165, fill=(31, 90, 54, 255), width=7)
    shine(draw, (59, 72, 197, 196), 105)
    return img


def frame_knight() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    shadow(draw)
    outline_ellipse(draw, (75, 50, 181, 170), (109, 132, 170, 255), width=8)
    draw.polygon([(72, 80), (42, 134), (89, 143)], fill=(42, 45, 64, 255))
    draw.polygon([(77, 88), (53, 130), (91, 137)], fill=(79, 139, 219, 255))
    draw.rectangle((91, 83, 166, 109), fill=(30, 33, 48, 255))
    draw_eye_pair(draw, 96, color=(83, 219, 255), angry=True)
    outline_round(draw, (94, 161, 159, 214), 18, (95, 108, 140, 255), width=6)
    shine(draw, (75, 50, 181, 170))
    return img


def frame_drone() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    shadow(draw, y=206, w=116)
    outline_round(draw, (78, 82, 178, 153), 30, (86, 159, 234, 255), width=8)
    draw_eye_pair(draw, 116, color=(255, 246, 103), angry=True)
    for x in (47, 209):
        outline_ellipse(draw, (x - 34, 78, x + 34, 142), (44, 56, 78, 255), width=6)
        draw.ellipse((x - 24, 88, x + 24, 132), fill=(123, 213, 255, 155))
        draw.line((x - 30, 110, x + 30, 110), fill=(255, 255, 255, 95), width=4)
    draw.line((128, 153, 128, 192), fill=(44, 56, 78, 255), width=8)
    outline_ellipse(draw, (108, 178, 148, 218), (255, 207, 66, 255), width=5)
    shine(draw, (78, 82, 178, 153))
    return img


def frame_barrel_tank() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    shadow(draw, w=164)
    outline_round(draw, (64, 86, 192, 182), 26, (173, 101, 47, 255), width=8)
    draw.rectangle((82, 93, 174, 175), fill=(207, 128, 59, 255))
    for x in (99, 128, 157):
        draw.line((x, 91, x, 177), fill=(120, 68, 38, 170), width=6)
    outline_round(draw, (89, 48, 167, 102), 18, (61, 70, 82, 255), width=7)
    draw_eye_pair(draw, 75, color=(255, 219, 68), angry=True)
    for x in (76, 180):
        draw.ellipse((x - 30, 167, x + 30, 217), fill=(50, 47, 50, 255))
        draw.ellipse((x - 18, 177, x + 18, 207), fill=(115, 111, 110, 255))
    shine(draw, (64, 86, 192, 182), 80)
    return img


def frame_cactus() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    shadow(draw, w=118)
    outline_round(draw, (87, 48, 169, 203), 36, (71, 179, 99, 255), width=8)
    for x, side in ((69, -1), (187, 1)):
        outline_round(draw, (x - 24, 98, x + 24, 170), 24, (65, 167, 91, 255), width=6)
        draw.line((x + side * 12, 96, x + side * 37, 77), fill=(63, 48, 40, 255), width=8)
    draw_eye_pair(draw, 96, color=(255, 241, 116), angry=True)
    for x in (105, 126, 148):
        draw.line((x, 61, x, 188), fill=(173, 238, 145, 80), width=4)
    for x, y in ((92, 82), (164, 138), (111, 167), (150, 72)):
        draw.line((x, y, x + 12, y - 8), fill=(235, 255, 188, 165), width=3)
    return img


def frame_clock_wizard() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    shadow(draw, w=130)
    draw.polygon([(128, 35), (75, 102), (181, 102)], fill=(54, 41, 79, 255))
    draw.polygon([(128, 48), (92, 94), (166, 94)], fill=(137, 92, 214, 255))
    outline_ellipse(draw, (70, 84, 186, 200), (95, 69, 157, 255), width=8)
    outline_ellipse(draw, (96, 111, 160, 175), (255, 239, 159, 255), outline=(50, 38, 66), width=6)
    draw.line((128, 143, 128, 122), fill=(61, 49, 78, 255), width=5)
    draw.line((128, 143, 146, 151), fill=(61, 49, 78, 255), width=5)
    draw_eye_pair(draw, 103, color=(255, 244, 92), angry=True)
    draw.arc((84, 72, 172, 218), 205, 337, fill=(238, 202, 93, 210), width=6)
    return img


def frame_boss_core() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    shadow(draw, w=176)
    outline_round(draw, (61, 55, 195, 188), 34, (78, 84, 98, 255), width=10)
    draw.rectangle((81, 83, 175, 118), fill=(26, 29, 42, 255))
    draw_eye_pair(draw, 101, color=(255, 213, 52), angry=True)
    outline_ellipse(draw, (93, 128, 163, 196), (241, 65, 52, 255), width=7)
    draw.ellipse((109, 144, 147, 181), fill=(255, 216, 91, 255))
    for x in (48, 208):
        outline_round(draw, (x - 23, 98, x + 23, 178), 18, (61, 67, 78, 255), width=6)
    shine(draw, (61, 55, 195, 188), 65)
    return img


def frame_spider() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    shadow(draw, w=154)
    outline_ellipse(draw, (70, 82, 186, 180), (107, 88, 186, 255), width=8)
    draw_eye_pair(draw, 111, color=(255, 235, 90), angry=True)
    for i, x in enumerate((78, 101, 155, 178)):
        sign = -1 if x < 128 else 1
        y = 160 + (i % 2) * 10
        draw.line((x, 155, x + sign * 38, y + 35), fill=(48, 39, 67, 255), width=9)
        draw.line((x + sign * 38, y + 35, x + sign * 58, y + 14), fill=(48, 39, 67, 255), width=7)
    draw.polygon([(128, 58), (143, 84), (113, 84)], fill=(255, 87, 104, 255))
    shine(draw, (70, 82, 186, 180), 65)
    return img


def icon_battery() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    draw.ellipse((38, 48, 218, 228), fill=(75, 219, 255, 50))
    outline_round(draw, (62, 83, 184, 171), 22, (73, 195, 255, 255), width=8)
    draw.rectangle((184, 111, 203, 143), fill=(49, 45, 58, 255))
    draw.polygon([(120, 92), (92, 136), (119, 132), (102, 164), (157, 117), (128, 121)], fill=(255, 245, 96, 255))
    shine(draw, (62, 83, 184, 171), 95)
    return img


def icon_multi() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    for x, y, c in ((88, 124, (77, 219, 255)), (128, 94, (255, 223, 83)), (168, 124, (255, 91, 121))):
        outline_ellipse(draw, (x - 40, y - 40, x + 40, y + 40), rgba(c), width=6)
        shine(draw, (x - 40, y - 40, x + 40, y + 40), 80)
    draw.line((88, 124, 128, 94, 168, 124), fill=(255, 255, 255, 120), width=8)
    return img


def icon_beacon() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    outline_ellipse(draw, (76, 76, 180, 180), (69, 139, 255, 255), width=8)
    draw.ellipse((101, 101, 155, 155), fill=(255, 255, 255, 225))
    for angle in range(0, 360, 45):
        x = 128 + math.cos(math.radians(angle)) * 77
        y = 128 + math.sin(math.radians(angle)) * 77
        draw.line((128, 128, x, y), fill=(112, 211, 255, 80), width=8)
    return img


def icon_shield() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    draw.ellipse((38, 38, 218, 218), fill=(72, 132, 255, 45))
    draw.polygon([(128, 38), (197, 66), (184, 160), (128, 218), (72, 160), (59, 66)], fill=(35, 42, 65, 255))
    draw.polygon([(128, 52), (183, 75), (172, 151), (128, 201), (84, 151), (73, 75)], fill=(83, 165, 255, 255))
    draw.polygon([(128, 65), (169, 82), (161, 143), (128, 183)], fill=(151, 229, 255, 200))
    return img


def icon_rocket_crate() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    outline_round(draw, (56, 107, 200, 181), 18, (187, 103, 46, 255), width=8)
    for x in (83, 128, 173):
        draw.polygon([(x, 54), (x + 28, 119), (x - 28, 119)], fill=(54, 51, 63, 255))
        draw.polygon([(x, 66), (x + 18, 113), (x - 18, 113)], fill=(247, 70, 54, 255))
        draw.polygon([(x - 15, 119), (x, 147), (x + 15, 119)], fill=(255, 198, 55, 255))
    return img


def icon_freeze() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    outline_ellipse(draw, (57, 57, 199, 199), (100, 224, 255, 255), width=8)
    for angle in range(0, 180, 30):
        dx = math.cos(math.radians(angle)) * 61
        dy = math.sin(math.radians(angle)) * 61
        draw.line((128 - dx, 128 - dy, 128 + dx, 128 + dy), fill=(255, 255, 255, 210), width=8)
    shine(draw, (57, 57, 199, 199), 115)
    return img


def icon_heal() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    outline_ellipse(draw, (55, 55, 201, 201), (71, 221, 103, 255), width=8)
    draw.rounded_rectangle((111, 76, 145, 180), radius=8, fill=(255, 255, 255, 240))
    draw.rounded_rectangle((76, 111, 180, 145), radius=8, fill=(255, 255, 255, 240))
    shine(draw, (55, 55, 201, 201), 105)
    return img


def icon_magnet() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    draw.ellipse((44, 40, 212, 216), fill=(255, 213, 74, 45))
    draw.arc((71, 54, 185, 184), 30, 150, fill=(50, 45, 60, 255), width=36)
    draw.arc((71, 54, 185, 184), 30, 150, fill=(255, 69, 68, 255), width=22)
    for x in (79, 177):
        outline_round(draw, (x - 22, 142, x + 22, 183), 10, (70, 149, 255, 255), width=5)
    for x, y in ((66, 77), (199, 79), (129, 42), (205, 159), (54, 163)):
        outline_ellipse(draw, (x - 13, y - 13, x + 13, y + 13), (255, 218, 74, 255), width=4)
    return img


def icon_laser() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    outline_round(draw, (54, 99, 202, 156), 22, (255, 225, 77, 255), width=8)
    draw.polygon([(86, 99), (151, 43), (140, 99)], fill=(255, 95, 72, 255))
    draw.polygon([(151, 156), (103, 217), (114, 156)], fill=(111, 232, 255, 255))
    draw.line((73, 128, 209, 128), fill=(255, 255, 255, 190), width=10)
    return img


def icon_drone_buddy() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    for x, y in ((87, 116), (169, 116), (128, 162)):
        outline_ellipse(draw, (x - 36, y - 31, x + 36, y + 31), (88, 195, 255, 255), width=6)
        draw.ellipse((x - 12, y - 8, x + 12, y + 8), fill=(255, 238, 91, 255))
    draw.line((87, 116, 128, 162, 169, 116), fill=(255, 255, 255, 100), width=8)
    return img


def icon_bomb() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    outline_ellipse(draw, (67, 85, 189, 207), (51, 56, 70, 255), width=8)
    draw.arc((119, 43, 185, 109), 190, 350, fill=(86, 77, 68, 255), width=10)
    for angle in range(0, 360, 45):
        x1 = 164 + math.cos(math.radians(angle)) * 12
        y1 = 67 + math.sin(math.radians(angle)) * 12
        x2 = 164 + math.cos(math.radians(angle)) * 31
        y2 = 67 + math.sin(math.radians(angle)) * 31
        draw.line((x1, y1, x2, y2), fill=(255, 223, 78, 210), width=5)
    shine(draw, (67, 85, 189, 207), 70)
    return img


def icon_overdrive() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    points = []
    for i in range(16):
        r = 88 if i % 2 == 0 else 52
        angle = math.radians(i * 22.5 - 90)
        points.append((128 + math.cos(angle) * r, 128 + math.sin(angle) * r))
    draw.polygon(points, fill=(69, 48, 93, 255))
    inner = []
    for i in range(16):
        r = 72 if i % 2 == 0 else 42
        angle = math.radians(i * 22.5 - 90)
        inner.append((128 + math.cos(angle) * r, 128 + math.sin(angle) * r))
    draw.polygon(inner, fill=(255, 206, 63, 255))
    draw.polygon([(128, 57), (145, 112), (201, 112), (155, 144), (173, 201), (128, 166), (83, 201), (101, 144), (55, 112), (111, 112)], fill=(255, 255, 255, 220))
    return img


def projectile_blue() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    draw.ellipse((71, 32, 185, 212), fill=(77, 178, 255, 42))
    outline_round(draw, (99, 52, 157, 172), 24, (80, 194, 255, 255), width=6)
    draw.polygon([(99, 72), (65, 100), (99, 118)], fill=(51, 82, 165, 255))
    draw.polygon([(157, 72), (191, 100), (157, 118)], fill=(51, 82, 165, 255))
    draw.polygon([(99, 172), (128, 223), (157, 172)], fill=(255, 210, 55, 255))
    shine(draw, (99, 52, 157, 172), 95)
    return img


def projectile_red() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    draw.ellipse((54, 28, 202, 226), fill=(255, 90, 50, 44))
    outline_round(draw, (95, 42, 161, 169), 27, (238, 70, 48, 255), width=6)
    draw.polygon([(95, 70), (56, 104), (95, 126)], fill=(112, 54, 70, 255))
    draw.polygon([(161, 70), (200, 104), (161, 126)], fill=(112, 54, 70, 255))
    draw.polygon([(95, 169), (128, 228), (161, 169)], fill=(255, 224, 65, 255))
    draw.polygon([(110, 171), (128, 211), (146, 171)], fill=(255, 122, 43, 255))
    shine(draw, (95, 42, 161, 169), 90)
    return img


def projectile_laser() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    draw.rounded_rectangle((114, 22, 142, 230), radius=14, fill=(255, 236, 80, 220))
    draw.rounded_rectangle((122, 28, 134, 224), radius=6, fill=(255, 255, 255, 255))
    draw.ellipse((80, 72, 176, 168), fill=(255, 226, 77, 55))
    return img


def projectile_plasma() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    outline_ellipse(draw, (62, 62, 194, 194), (115, 85, 255, 255), width=7)
    draw.ellipse((87, 87, 169, 169), fill=(255, 255, 255, 215))
    for angle in range(0, 360, 30):
        x = 128 + math.cos(math.radians(angle)) * 92
        y = 128 + math.sin(math.radians(angle)) * 92
        draw.line((128, 128, x, y), fill=(147, 236, 255, 95), width=5)
    return img


def fx_spark() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    for i in range(18):
        angle = math.radians(i * 20)
        r1 = 22 + (i % 3) * 7
        r2 = 91 + (i % 4) * 8
        draw.line((128 + math.cos(angle) * r1, 128 + math.sin(angle) * r1, 128 + math.cos(angle) * r2, 128 + math.sin(angle) * r2), fill=(255, 245, 114, 230), width=8 if i % 2 == 0 else 4)
    draw.ellipse((75, 75, 181, 181), fill=(255, 124, 66, 160))
    draw.ellipse((96, 96, 160, 160), fill=(255, 255, 255, 230))
    return img


def fx_explosion() -> Image.Image:
    img = new_frame()
    draw = ImageDraw.Draw(img, "RGBA")
    points = []
    for i in range(24):
        r = 108 if i % 2 == 0 else 55
        angle = math.radians(i * 15 - 90)
        points.append((128 + math.cos(angle) * r, 128 + math.sin(angle) * r))
    draw.polygon(points, fill=(255, 91, 45, 225))
    points2 = []
    for i in range(18):
        r = 78 if i % 2 == 0 else 34
        angle = math.radians(i * 20 - 90)
        points2.append((128 + math.cos(angle) * r, 128 + math.sin(angle) * r))
    draw.polygon(points2, fill=(255, 224, 72, 245))
    draw.ellipse((93, 93, 163, 163), fill=(255, 255, 255, 235))
    return img


FRAME_BUILDERS = [
    frame_robot,
    frame_crab,
    frame_slime,
    frame_knight,
    frame_drone,
    frame_barrel_tank,
    frame_cactus,
    frame_clock_wizard,
    frame_boss_core,
    frame_spider,
    icon_battery,
    icon_multi,
    icon_beacon,
    icon_shield,
    icon_rocket_crate,
    icon_freeze,
    icon_heal,
    icon_magnet,
    icon_laser,
    icon_drone_buddy,
    icon_bomb,
    icon_overdrive,
    projectile_blue,
    projectile_red,
    projectile_laser,
    projectile_plasma,
    fx_spark,
    fx_explosion,
]


def polish(img: Image.Image) -> Image.Image:
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    alpha = img.getchannel("A")
    glow_color = Image.new("RGBA", img.size, (255, 255, 255, 0))
    glow_color.putalpha(alpha.filter(ImageFilter.GaussianBlur(3)))
    glow = Image.alpha_composite(glow, glow_color)
    return Image.alpha_composite(glow, img)


def generate() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    FRAMES.mkdir(parents=True, exist_ok=True)
    atlas = Image.new("RGBA", (COLS * SIZE, ROWS * SIZE), (0, 0, 0, 0))
    for index, builder in enumerate(FRAME_BUILDERS):
        frame = polish(builder())
        x = index % COLS * SIZE
        y = index // COLS * SIZE
        atlas.alpha_composite(frame, (x, y))
        frame.save(FRAMES / f"combat-asset-{index:02d}.png")
    atlas.save(OUT)


if __name__ == "__main__":
    generate()
