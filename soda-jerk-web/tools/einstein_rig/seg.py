"""Split the (mirrored) Einstein into upper body, near leg and far leg."""
from PIL import Image, ImageOps
import numpy as np

PAD_X, PAD_Y = 24, 6

import os
HERE = os.path.dirname(os.path.abspath(__file__))

def load():
    # source.png is the untouched PixelLab portrait; crop to the figure,
    # then mirror so he faces LEFT like the rest of the roster
    src = Image.open(os.path.join(HERE, "source.png")).convert("RGBA")
    fig = ImageOps.mirror(src.crop(src.getbbox()))
    W, H = fig.size
    canvas = Image.new("RGBA", (W + 2 * PAD_X, H + 2 * PAD_Y), (0, 0, 0, 0))
    canvas.paste(fig, (PAD_X, PAD_Y))
    return canvas

def split(img):
    # (callers may hand in a recoloured copy of load())
    a = np.array(img)
    H, W = a.shape[:2]
    op = a[:, :, 3] > 40
    X, Y = np.meshgrid(np.arange(W), np.arange(H))
    fx, fy = X - PAD_X, Y - PAD_Y          # figure coords (pre-pad)
    HEM = 150
    CROTCH = 197
    legs = op & (fy >= HEM)
    # the trailing (near-arm) hand dips into the leg rows on the right; it's upper body
    legs &= ~((fx >= 104) & (fy <= 170))
    # near (lighter, forward, left) vs far (darker, trailing, right).
    # Thigh region: split along the seam from (100,152) to (73,197).
    seam_x = 100 + (fy - 152) * (73 - 100) / (197 - 152)
    near = legs & (fy < CROTCH) & (fx < seam_x)
    far = legs & (fy < CROTCH) & (fx >= seam_x)
    # Below the crotch the legs are separate: split each row at its widest gap.
    for y in range(PAD_Y + CROTCH, H):
        xs = np.where(legs[y])[0]
        if not len(xs):
            continue
        gaps = np.diff(xs)
        if gaps.max() > 1:
            k = gaps.argmax()
            cut = (xs[k] + xs[k + 1]) / 2
        else:
            cut = PAD_X + 73
        near[y] = legs[y] & (np.arange(W) < cut)
        far[y] = legs[y] & (np.arange(W) >= cut)
    upper = op & ~near & ~far

    def layer(mask):
        out = np.zeros_like(a)
        out[mask] = a[mask]
        return out

    far_l = layer(far)
    # The near leg hides the top of the far thigh. Grow the far leg's own
    # colours into that hidden strip so a swing never opens a hole in it.
    hide = near & (np.arange(H)[:, None] < PAD_Y + HEM + 16)
    for _ in range(24):
        have = far_l[:, :, 3] > 40
        if not (hide & ~have).any():
            break
        grown = np.zeros_like(have)
        src = np.zeros_like(far_l)
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            sh = np.roll(np.roll(have, dy, 0), dx, 1)
            sv = np.roll(np.roll(far_l, dy, 0), dx, 1)
            take = hide & ~have & sh & ~grown
            src[take] = sv[take]
            grown |= take
        far_l[grown] = src[grown]
    return Image.fromarray(layer(upper)), Image.fromarray(layer(near)), Image.fromarray(far_l)
