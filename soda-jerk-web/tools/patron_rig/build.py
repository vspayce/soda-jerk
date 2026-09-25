"""Rebuild patron art from the source portraits in this folder.

    python3 build.py            every character, plus the jerk's run
    python3 build.py man clown  just those

Each character writes eight files to public/art (portrait, held-drink and
walk sheet in both colours, and the two sprays) and prints the ground to
put in Customer.jsx's PATRON_WALK_SHEETS
(`ground`, how far one walk cycle carries them).
"""
import subprocess
import sys

from characters import CHARACTERS
from rig import build, load, ground

names = sys.argv[1:] or list(CHARACTERS)
for name in names:
    cfg = CHARACTERS[name]
    w, h = build(cfg)
    print(f"{name:9s} {cfg['names']['portrait']:8s} canvas {w}x{h}  ground {ground(cfg, load(cfg)):.3f}")
if not sys.argv[1:]:
    subprocess.run([sys.executable, "jerk_run.py"], check=True)
