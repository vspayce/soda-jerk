"""Orange cardigan -> pink cardigan, touching nothing else."""
import numpy as np
from PIL import Image

# Where his skin is, in canvas coords, so a saturated knuckle shadow can't
# get caught up in the cardigan's colour range and turn pink.
PROTECT = [
    (0, 0, 999, 60),        # face, hair, collar-up
    (26, 132, 47, 158),     # forward hand only, not its cuff
    (126, 152, 160, 180),   # trailing hand only, not its cuff
]

def to_pink(img):
    a = np.array(img).astype(np.float32)
    rgb = a[:, :, :3] / 255.0
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    d = mx - mn
    v = mx
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.zeros_like(mx)
    m = d > 1e-6
    rr = m & (mx == r); gg = m & (mx == g) & ~rr; bb = m & ~rr & ~gg
    h[rr] = ((g - b)[rr] / d[rr]) % 6
    h[gg] = (b - r)[gg] / d[gg] + 2
    h[bb] = (r - g)[bb] / d[bb] + 4
    h = h * 60
    sel = (a[:, :, 3] > 40) & (s > 0.58) & (h >= 4) & (h <= 28) & (v > 0.18)
    H, W = mx.shape
    Y, X = np.mgrid[0:H, 0:W]
    for x0, y0, x1, y1 in PROTECT:
        sel &= ~((X >= x0) & (X < x1) & (Y >= y0) & (Y < y1))
    # a dusty rose rather than a hot pink, matching the "In the Hay" tap
    nh = np.where(sel, 338.0, h)
    ns = np.where(sel, s * 0.72, s)
    nv = np.where(sel, np.minimum(1.0, v * 1.10), v)
    hh = (nh / 60.0) % 6
    c = nv * ns
    x = c * (1 - np.abs(hh % 2 - 1))
    z = np.zeros_like(c)
    conds = [hh < 1, hh < 2, hh < 3, hh < 4, hh < 5, hh <= 6]
    R = np.select(conds, [c, x, z, z, x, c]); G = np.select(conds, [x, c, c, x, z, z]); B = np.select(conds, [z, z, x, c, c, x])
    mm = nv - c
    out = a.copy()
    out[:, :, 0] = np.where(sel, (R + mm) * 255, a[:, :, 0])
    out[:, :, 1] = np.where(sel, (G + mm) * 255, a[:, :, 1])
    out[:, :, 2] = np.where(sel, (B + mm) * 255, a[:, :, 2])
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)), int(sel.sum())
