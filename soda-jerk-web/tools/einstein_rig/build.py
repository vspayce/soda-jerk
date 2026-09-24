"""Rebuild every Einstein asset from source.png: run `python3 build.py`."""
import os
from PIL import Image
from seg import load
from recolor import to_pink
from anim import frames
from props import held, spray

ART = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public", "art")

for colour in ("orange", "pink"):
    base = load() if colour == "orange" else to_pink(load())[0]
    base.save(f"{ART}/patron5-{colour}.png")
    held(base, colour).save(f"{ART}/patron5-{colour}-held.png")
    spray(base).save(f"{ART}/spray-patron5-{colour}.png")
    fr, _ = frames(recolor=to_pink if colour == "pink" else None)
    w, h = fr[0].size
    sheet = Image.new("RGBA", (w * 8, h), (0, 0, 0, 0))
    for i, f in enumerate(fr):
        sheet.paste(f, (i * w, 0))
    sheet.save(f"{ART}/patron5-{colour}-walk.png")
    print(colour, "done")
