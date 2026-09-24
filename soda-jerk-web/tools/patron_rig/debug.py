"""Check a character's settings by eye: `python3 debug.py NAME OUT_DIR`.

Writes NAME-split.png (body grey, near leg green, far leg red, garment
mask in magenta, drink hand as a cross, on a 10px grid in figure coords)
and NAME-walk.png (both colours' walk frames side by side)."""
import sys

import numpy as np
from PIL import Image, ImageDraw

from characters import CHARACTERS
from rig import load, split, garment_mask, frames, to_pink, held, spray

name, out = sys.argv[1], sys.argv[2]
cfg = CHARACTERS[name]
img = load(cfg)
px, py = cfg["pad"]
upper_mask, _, groups = split(cfg, img)
a = np.array(img).astype(np.float32)
vis = a.copy()
vis[:, :, :3] = vis[:, :, :3] * 0.35 + 150 * 0.65
for near, far in groups:
    for layer, col in ((near, (40, 200, 60)), (far, (220, 50, 50))):
        m = np.array(layer)[:, :, 3] > 40
        vis[m, :3] = np.array(col) * 0.7 + a[m, :3] * 0.3
gm = garment_mask(cfg, img)
side = a.copy()
side[gm, :3] = (255, 0, 255)
Z = 3
row = np.concatenate([vis, side], axis=1).clip(0, 255).astype(np.uint8)
im = Image.fromarray(row)
bg = Image.new("RGBA", im.size, (235, 228, 210, 255)); bg.alpha_composite(im)
bg = bg.resize((bg.width * Z, bg.height * Z), Image.NEAREST)
d = ImageDraw.Draw(bg)
W = img.width
for off in (0, W):
    for x in range(0, W - 2 * px, 10):
        c = (255, 0, 0, 255) if x % 50 == 0 else (0, 0, 255, 60)
        d.line([((off + x + px) * Z, 0), ((off + x + px) * Z, bg.height)], fill=c)
        if x % 50 == 0:
            d.text(((off + x + px) * Z + 2, 2), str(x), fill=(0, 0, 0))
    for y in range(0, img.height - 2 * py, 10):
        c = (255, 0, 0, 255) if y % 50 == 0 else (0, 0, 255, 60)
        d.line([(off * Z, (y + py) * Z), ((off + W) * Z, (y + py) * Z)], fill=c)
        if y % 50 == 0:
            d.text((off * Z + 2, (y + py) * Z + 2), str(y), fill=(0, 0, 0))
hx, hy = cfg["hand"]
for off in (0, W):
    d.line([((off + hx - 4) * Z, hy * Z), ((off + hx + 4) * Z, hy * Z)], fill=(0, 0, 0), width=3)
    d.line([((off + hx) * Z, (hy - 4) * Z), ((off + hx) * Z, (hy + 4) * Z)], fill=(0, 0, 0), width=3)
bg.save(f"{out}/{name}-split.png")

if len(sys.argv) > 3 and sys.argv[3] == "split":
    sys.exit()

pink = to_pink(cfg, img)
fo, fp = frames(cfg, img), frames(cfg, pink)
tiles = fo + [held(cfg, img, "orange"), held(cfg, pink, "pink")]
tiles2 = fp + [spray(cfg, img)[0], spray(cfg, pink)[3]]
w = sum(t.width for t in tiles2) + 4 * len(tiles2)
sheet = Image.new("RGBA", (w, img.height * 2 + 8), (200, 190, 170, 255))
x = 0
for t in tiles:
    sheet.alpha_composite(t, (x, 0)); x += t.width + 4
x = 0
for t in tiles2:
    sheet.alpha_composite(t, (x, img.height + 8)); x += t.width + 4
# floor line, so a foot that sinks or floats shows up
dd = ImageDraw.Draw(sheet)
for yy in (img.height - py, 2 * img.height + 8 - py):
    dd.line([(0, yy), (sheet.width, yy)], fill=(120, 60, 60, 255))
sheet.save(f"{out}/{name}-walk.png")
