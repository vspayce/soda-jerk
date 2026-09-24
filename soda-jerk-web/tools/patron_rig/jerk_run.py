"""The jerk's run cycle, from one PixelLab picture of him mid-stride.

`python3 jerk_run.py` writes public/art/player-run-cycle.png (8 frames,
facing right like the rest of his art). `python3 jerk_run.py DIR` writes a
debug sheet there instead.

The patron rig swings a whole leg from the hip, which is right for a
walk. A run needs more: the knee is nearly straight while the foot is on
the ground and folds right up as the leg swings through. So here each leg
is two bones — the thigh turns about the hip, the shin about the knee —
driven by a run cycle, and the arms pump opposite the legs.

The picture faces right; it's mirrored to face left for rigging (so
"forward" means left, as in rig.py) and mirrored back at the end.
Coordinates below are in that mirrored, cropped figure.
"""
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageOps

from rig import ART, HERE, drop_specks, sheet

SS = 3
PAD = (10, 4)
N = 8

SOURCE = "jerk-run-src.png"
HEM = 185  # below the belt; legs start here
# the apron hangs in front of the near thigh; it's body, not leg
APRON = [(58, 184), (138, 176), (142, 206), (128, 226), (102, 234), (78, 230), (60, 212)]
# near leg is the one in front (left); everything right of this is the far leg
SEAM = [(118, 185), (118, 245), (150, 282), (162, 350)]

LEGS = {
    #          hip          knee         ankle
    "near": ((95, 192), (48, 219), (106, 286)),
    "far": ((132, 192), (168, 258), (205, 318)),
}
THIGH_W = 27  # the near thigh is drawn, since the apron hides most of it

ARMS = [
    # region box (x0, y0, x1, y1), pivot, swing (degrees on screen; + = CCW)
    ((0, 84, 68, 154), (68, 118), 55),     # forward fist: swings down and back
    ((158, 86, 229, 178), (160, 100), -55),  # trailing fist: swings forward
]

WHITE = (250, 250, 250, 255)
SHADE = (196, 196, 204, 255)
INK = (18, 16, 20, 255)


def load():
    src = Image.open(os.path.join(HERE, SOURCE)).convert("RGBA")
    fig = ImageOps.mirror(src.crop(src.getbbox()))
    canvas = Image.new("RGBA", (fig.width + 2 * PAD[0], fig.height + 2 * PAD[1]), (0, 0, 0, 0))
    canvas.paste(fig, PAD)
    return canvas


def P(pt):
    """figure coords -> canvas coords"""
    return (pt[0] + PAD[0], pt[1] + PAD[1])


def poly_mask(shape, pts):
    m = Image.new("L", (shape[1], shape[0]), 0)
    ImageDraw.Draw(m).polygon([P(p) for p in pts], fill=255)
    return np.array(m) > 0


def seam_x(y):
    for (x0, y0), (x1, y1) in zip(SEAM, SEAM[1:]):
        if y0 <= y <= y1:
            return x0 + (y - y0) * (x1 - x0) / (y1 - y0)
    return SEAM[-1][0]


def fwd_angle(a, b):
    """Angle of the bone a->b from straight down; + = forward (left)."""
    return math.degrees(math.atan2(a[0] - b[0], b[1] - a[1]))


def layers(img):
    a = np.array(img)
    H, W = a.shape[:2]
    op = a[:, :, 3] > 40
    Y, X = np.mgrid[0:H, 0:W]
    fy, fx = Y - PAD[1], X - PAD[0]
    legs = op & (fy >= HEM) & ~poly_mask(a.shape, APRON)
    sx = np.vectorize(seam_x)(np.arange(H) - PAD[1])[:, None]
    near = legs & (fx < sx)
    far = legs & (fx >= sx)
    arms = []
    body = op & ~near & ~far
    for (x0, y0, x1, y1), pivot, swing in ARMS:
        m = body & (fx >= x0) & (fx < x1) & (fy >= y0) & (fy <= y1)
        arms.append((m, pivot, swing))
        body &= ~m

    def lay(m):
        out = np.zeros_like(a); out[m] = a[m]; return out
    return lay(body), lay(near), lay(far), [(lay(m), p, s) for m, p, s in arms]


def split_bone(layer, hip, knee, ankle):
    """Cut a leg at the knee along the line that bisects the joint."""
    H, W = layer.shape[:2]
    Y, X = np.mgrid[0:H, 0:W]
    k = np.array(P(knee), float)
    u1 = np.array(P(hip), float) - k; u1 /= np.linalg.norm(u1)
    u2 = np.array(P(ankle), float) - k; u2 /= np.linalg.norm(u2)
    n = u1 - u2; n /= np.linalg.norm(n)
    side = (X - k[0]) * n[0] + (Y - k[1]) * n[1]
    thigh = layer.copy(); thigh[side < -2] = 0   # a little overlap at the joint
    shin = layer.copy(); shin[side >= 0] = 0
    return thigh, shin


def up(arr):
    im = Image.fromarray(arr)
    return im.resize((im.width * SS, im.height * SS), Image.NEAREST)


def rotate_about(im, deg, pivot, to=None):
    """Rotate `im` (already at SS) about canvas-coord `pivot`, optionally
    moving the pivot to `to`. + deg = counter-clockwise on screen."""
    px, py = pivot[0] * SS, pivot[1] * SS
    if to is None:
        return im.rotate(deg, resample=Image.NEAREST, center=(px, py))
    tx, ty = to[0] * SS - px, to[1] * SS - py
    return im.rotate(deg, resample=Image.NEAREST, center=(px, py), translate=(tx, ty))


def rot_pt(pt, deg_fwd, about):
    """Where `pt` lands when turned `deg_fwd` forward about `about`."""
    r = math.radians(deg_fwd)
    dx, dy = pt[0] - about[0], pt[1] - about[1]
    # forward (left) for a point below the pivot is clockwise on screen
    return (about[0] + dx * math.cos(r) - dy * math.sin(r),
            about[1] + dx * math.sin(r) + dy * math.cos(r))


def capsule(size, a, b, w):
    """A plain trouser thigh from a to b (canvas coords), drawn at the
    picture's own pixel size with its hard ink outline, then scaled up like
    everything else — drawn smooth at 3x it read as a balloon.

    Returned as (outline, fill) so the shin can go between the two: the
    fill then covers the joint, and the outline only shows round the
    outside of the knee instead of ringing it like a ball."""
    W, H = size[0] // SS, size[1] // SS
    ink = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fill = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    r = w / 2
    d = ImageDraw.Draw(ink)
    d.line([a, b], fill=INK, width=int(round(2 * r + 4)))
    for x, y in (a, b):
        d.ellipse([x - r - 2, y - r - 2, x + r + 2, y + r + 2], fill=INK)
    d = ImageDraw.Draw(fill)
    d.line([a, b], fill=WHITE, width=int(round(2 * r)))
    for x, y in (a, b):
        d.ellipse([x - r, y - r, x + r, y + r], fill=WHITE)
    # a band of shadow along the underside, like the drawn trousers
    vx, vy = b[0] - a[0], b[1] - a[1]
    L = math.hypot(vx, vy)
    nx, ny = -vy / L, vx / L
    if ny < 0:
        nx, ny = -nx, -ny
    o = r * 0.62
    d.line([(a[0] + nx * o, a[1] + ny * o), (b[0] + nx * o, b[1] + ny * o)], fill=SHADE, width=max(2, int(r * 0.45)))
    return ink.resize(size, Image.NEAREST), fill.resize(size, Image.NEAREST)


def knee_cap(size, k, w):
    W, H = size[0] // SS, size[1] // SS
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x, y, r = k[0], k[1], w / 2
    d.ellipse([x - r - 2, y - r - 2, x + r + 2, y + r + 2], fill=INK)
    d.ellipse([x - r, y - r, x + r, y + r], fill=WHITE)
    return im.resize(size, Image.NEAREST)


def cycle(phi):
    """Thigh angle and knee bend for a leg at phase phi. phi = 0 is the
    near leg in the source picture: thigh well forward, knee still bent
    from swinging through, about to reach out for the ground."""
    thigh = 12 + 46 * math.cos(phi)
    # straight-ish through the stance, folded up through the swing
    knee = 14 + 100 * max(0.0, math.cos(phi - 7 * math.pi / 4)) ** 1.3
    return thigh, knee


def frames(img):
    body, near, far, arms = layers(img)
    size = (img.width * SS, img.height * SS)
    ground = (img.height - PAD[1]) * SS
    src = {k: (P(h), P(kn), P(an)) for k, (h, kn, an) in LEGS.items()}
    parts = {}
    for name, arr in (("near", near), ("far", far)):
        h, kn, an = LEGS[name]
        th, sh = split_bone(arr, h, kn, an)
        parts[name] = (up(th), up(sh))
    out = []
    for i in range(N):
        phi = i / N * 2 * math.pi
        legs = Image.new("RGBA", size, (0, 0, 0, 0))
        for name, off in (("far", math.pi), ("near", 0.0)):
            hip, knee, ankle = src[name]
            t_thigh, t_knee = cycle(phi + off)
            s_thigh = fwd_angle(hip, knee)
            s_shin = fwd_angle(knee, ankle)
            d_thigh = t_thigh - s_thigh
            new_knee = rot_pt(knee, d_thigh, hip)
            d_shin = (t_thigh - t_knee) - s_shin
            th, sh = parts[name]
            shin = rotate_about(sh, -d_shin, knee, to=new_knee)
            layer = Image.new("RGBA", size, (0, 0, 0, 0))
            if name == "far":
                # fills the notch a bent knee opens between the two cuts
                layer.alpha_composite(knee_cap(size, new_knee, THIGH_W * 0.8))
            if name == "near":
                # the apron hides nearly all of this thigh in the picture,
                # so it's drawn rather than cut
                ink, fill = capsule(size, hip, new_knee, THIGH_W)
                layer.alpha_composite(ink)
                layer.alpha_composite(shin)
                layer.alpha_composite(fill)
            else:
                layer.alpha_composite(shin)
                layer.alpha_composite(rotate_about(th, -d_thigh, hip))
            legs.alpha_composite(layer)
        lowest = np.where((np.array(legs)[:, :, 3] > 40).any(axis=1))[0].max()
        dy = ground - lowest
        f = Image.new("RGBA", size, (0, 0, 0, 0))
        f.alpha_composite(legs, (0, dy))
        f.alpha_composite(up(body), (0, dy))
        for arr, pivot, swing in arms:
            # arms pump against the legs: back when the near leg is forward
            a = swing * (1 - math.cos(phi)) / 2
            f.alpha_composite(rotate_about(up(arr), a, P(pivot)), (0, dy))
        f = f.resize(img.size, Image.LANCZOS)
        out.append(ImageOps.mirror(drop_specks(f, clean_alpha=True)))
    return out


if __name__ == "__main__":
    img = load()
    fr = frames(img)
    if len(sys.argv) > 1:
        s = sheet(fr)
        bg = Image.new("RGBA", s.size, (200, 190, 170, 255)); bg.alpha_composite(s)
        bg.save(os.path.join(sys.argv[1], "jerk-run.png"))
    else:
        sheet(fr).save(os.path.join(ART, "player-run-cycle.png"))
        print("frame", fr[0].size)
