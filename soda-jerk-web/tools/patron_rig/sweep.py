"""Compare settings side by side: python3 sweep.py NAME OUT 'k=v,k=v' 'k=v' ..."""
import copy, sys
from PIL import Image
from rig import load, frames
from characters import CHARACTERS
name, out = sys.argv[1], sys.argv[2]
rows = []
for spec in sys.argv[3:]:
    cfg = copy.deepcopy(CHARACTERS[name])
    for kv in filter(None, spec.split(",")):
        k, v = kv.split("=")
        for g in cfg["groups"]:
            g[k] = v if k in ("knee", "seam") else float(v) if "." in v else int(v)
    img = load(cfg)
    fr = frames(cfg, img)
    top = int(img.height * 0.42)
    strip = Image.new("RGBA", (img.width * 8, img.height - top), (200, 190, 170, 255))
    for i, f in enumerate(fr):
        strip.alpha_composite(f.crop((0, top, img.width, img.height)), (i * img.width, 0))
    rows.append(strip)
sheet = Image.new("RGBA", (rows[0].width, sum(r.height + 4 for r in rows)), (90, 60, 60, 255))
y = 0
for r in rows:
    sheet.paste(r, (0, y)); y += r.height + 4
sheet.save(out)
