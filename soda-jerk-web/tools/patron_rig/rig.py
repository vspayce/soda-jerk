"""Cut-out rig shared by every patron (and the jerk's run).

One source portrait per character goes in; everything the game shows of
them comes out of it: the standing portrait, an 8-frame walk made by
swinging the legs about the hip and bending them at the knee, the pink
version as a recolour of the same pixels, and the held-drink and siphon
poses. Because every file is cut from one picture, the orange and pink
versions are always the same person, and nothing jumps when the game
swaps one pose for another.

A character is described by a config dict (see characters.py):

  source     portrait file in this folder
  mirror     flip it so the character faces left like the roster
  fig_h      scale the figure to this height (None keeps it as drawn)
  pad        (x, y) transparent margin round the figure
  groups     one entry per walker in the picture (the mom and son are two)
    x0, x1       the walker's columns, in figure coords
    hem          first row that belongs to the legs
    crotch       where the legs part; above it they're split along `seam`
    seam         ((x, y), (x, y)): the line between the thighs
    upper_boxes  boxes inside the leg rows that belong to the body
                 instead (a hand hanging at the side, a cane)
    fill_rows    how far below the hem to rebuild the hidden far thigh
    knee_max     how much a knee bends on the forward swing, in degrees
    knee         "rotate" (rigid shin) or "shear" (see pose_leg)
    lift         how high the swinging foot clears the floor (with
                 cfg["gait"] = "planted"), in figure px
    extend_top   run the leg up this far under the body (see _extend_top)
  recolor    what counts as the orange garment, and what to leave alone
             (protect boxes are canvas coords unless fig_coords is set)
  hand       (x, y) canvas coords of the hand that takes the drink
  gait       "planted" plants the leg that's pushing back and lifts the
             other through its swing; unset plants whichever foot is
             lowest (the original rig, still used for Chaplin)
Figure coords are the cropped figure before padding; canvas coords
include the padding.
"""
import math
import os
from collections import deque

import numpy as np
from PIL import Image, ImageDraw, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ART = os.path.join(HERE, "..", "..", "public", "art")
SS = 3  # rotate at 3x so the cut edges don't go ragged


# ---------------------------------------------------------------- loading

def load(cfg):
    src = Image.open(os.path.join(HERE, cfg["source"])).convert("RGBA")
    fig = src.crop(src.getbbox())
    if cfg.get("mirror"):
        fig = ImageOps.mirror(fig)
    fh = cfg.get("fig_h")
    if fh and fig.height != fh:
        fig = fig.resize((round(fig.width * fh / fig.height), fh), Image.LANCZOS)
        # LANCZOS leaves a faint haze of near-transparent pixels round the
        # edge; snap alpha so the cut layers have a clean outline
        a = np.array(fig)
        al = a[:, :, 3]
        a[:, :, 3] = np.where(al < 60, 0, np.where(al > 200, 255, al))
        fig = Image.fromarray(a)
    px, py = cfg["pad"]
    canvas = Image.new("RGBA", (fig.width + 2 * px, fig.height + 2 * py), (0, 0, 0, 0))
    canvas.paste(fig, (px, py))
    return canvas


# ---------------------------------------------------------------- splitting

def _grow_into(layer, hide):
    """Grow a layer's own colours into `hide`, a region another layer
    covers, so swinging that other layer away never opens a hole."""
    for _ in range(24):
        have = layer[:, :, 3] > 40
        if not (hide & ~have).any():
            break
        grown = np.zeros_like(have)
        src = np.zeros_like(layer)
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            sh = np.roll(np.roll(have, dy, 0), dx, 1)
            sv = np.roll(np.roll(layer, dy, 0), dx, 1)
            take = hide & ~have & sh & ~grown
            src[take] = sv[take]
            grown |= take
        layer[grown] = src[grown]
    return layer


def _extend_top(layer, n):
    """Run each column of a leg up `n` rows past where it's cut. The
    extension sits behind the body, so it's never seen in the portrait,
    but when the leg swings it fills what would otherwise be a gap
    opening under the hem — a leg is longer than the part that shows."""
    op = layer[:, :, 3] > 40
    rows = np.where(op.any(axis=1))[0]
    if not len(rows):
        return layer
    top = rows.min()
    out = layer.copy()
    for x in np.where(op[top:top + 4].any(axis=0))[0]:
        y = top + np.argmax(op[top:top + 4, x])
        out[max(0, y - n):y, x] = layer[y, x]
    return out


def _auto_thighs(legs, fy, fx, hem, crotch, fit_rows):
    """Where the thighs merge there's no visible line between them, and any
    cut becomes a leg's outline the moment it swings clear of the other
    one. So rather than draw a seam, carry each leg's own outer edge on up:
    fit a line to the near leg's back edge and the far leg's front edge
    just below the crotch, and extend both to the hem. The wedge between
    the lines belongs to BOTH legs, so each keeps a clean straight outline
    whichever way it swings."""
    H, W = legs.shape
    ys, nb, ff = [], [], []
    py = -fy[0, 0]
    for yy in range(crotch, crotch + fit_rows):
        row = np.where(legs[yy + py])[0]
        if not len(row):
            continue
        gaps = np.diff(row)
        if not len(gaps) or gaps.max() <= 1:
            continue
        k = gaps.argmax()
        ys.append(yy); nb.append(row[k]); ff.append(row[k + 1])
    if len(ys) < 4:
        raise ValueError("auto seam: legs don't part below the crotch")
    pn = np.polyfit(ys, nb, 1)
    pf = np.polyfit(ys, ff, 1)
    X = np.arange(W)[None, :]
    rows = fy[:, :1]
    near_edge = np.polyval(pn, rows)
    far_edge = np.polyval(pf, rows)
    band = (fy >= hem) & (fy < crotch)
    near = legs & band & (X <= near_edge)
    far = legs & band & (X >= far_edge)
    return near, far


def split(cfg, img):
    """-> upper-body mask, and per group (near leg layer, far leg layer)."""
    a = np.array(img)
    H, W = a.shape[:2]
    px, py = cfg["pad"]
    op = a[:, :, 3] > 40
    X, Y = np.meshgrid(np.arange(W), np.arange(H))
    fx, fy = X - px, Y - py

    def layer(mask):
        out = np.zeros_like(a)
        out[mask] = a[mask]
        return out

    all_legs = np.zeros_like(op)
    out = []
    for g in cfg["groups"]:
        inside = (fx >= g.get("x0", -10**6)) & (fx < g.get("x1", 10**6))
        hem, crotch = g["hem"], g["crotch"]
        legs = op & inside & (fy >= hem)
        for x0, y0, x1, y1 in g.get("upper_boxes", []):
            legs &= ~((fx >= x0) & (fx < x1) & (fy >= y0) & (fy <= y1))
        near = np.zeros_like(op)
        far = np.zeros_like(op)
        seam = g.get("seam")
        if seam == "auto" and crotch > hem:
            near, far = _auto_thighs(legs, fy, fx, hem, crotch, g.get("fit_rows", 30))
            fallback = None
        elif seam and crotch > hem:
            (sx0, sy0), (sx1, sy1) = seam
            seam_x = sx0 + (fy - sy0) * (sx1 - sx0) / (sy1 - sy0)
            near = legs & (fy < crotch) & (fx < seam_x)
            far = legs & (fy < crotch) & (fx >= seam_x)
            fallback = px + sx1
        else:
            fallback = px + g.get("split_x", 0)
        # Below the crotch the legs are separate: split each row at its widest gap.
        cols = np.arange(W)
        for y in range(py + crotch, H):
            xs = np.where(legs[y])[0]
            if not len(xs):
                continue
            gaps = np.diff(xs)
            if len(gaps) and gaps.max() > 1:
                k = gaps.argmax()
                cut = (xs[k] + xs[k + 1]) / 2
            else:
                cut = fallback if fallback is not None else (xs[0] + xs[-1]) / 2
            near[y] = legs[y] & (cols < cut)
            far[y] = legs[y] & (cols >= cut)
        all_legs |= near | far
        near_l, far_l = layer(near), layer(far)
        ext = g.get("extend_top", 0)
        if ext:
            near_l, far_l = _extend_top(near_l, ext), _extend_top(far_l, ext)
        # The near leg hides the top of the far thigh. Grow the far leg's own
        # colours into that hidden strip so a swing never opens a hole in it.
        hide = near & (np.arange(H)[:, None] < py + hem + g.get("fill_rows", 16))
        far_l = _grow_into(far_l, hide)
        nl, fl = Image.fromarray(near_l), Image.fromarray(far_l)
        if cfg.get("gait") == "planted":
            # The row-by-row split can hand one leg a few stray pixels of
            # the other's shoe. Harmless to look at, but they can be the
            # lowest thing in the layer, and the planted gait stands the
            # figure on its lowest pixel.
            nl, fl = drop_specks(nl, 40), drop_specks(fl, 40)
        out.append((nl, fl))
    upper = op & ~all_legs
    return upper, Image.fromarray(layer(upper)), out


# ---------------------------------------------------------------- animating

def joints(layer):
    al = np.array(layer)[:, :, 3] > 40
    ys, xs = np.where(al)
    top, bot = ys.min(), ys.max()
    hip_rows = al[top:top + 10]
    hx = np.where(hip_rows.any(axis=0))[0].mean()
    foot_rows = al[bot - 12:bot + 1]
    fx = np.where(foot_rows.any(axis=0))[0].mean()
    return (hx, top + 4), (fx, bot - 5)


def angle_fwd(hip, foot):
    """Angle from vertical, positive = forward, i.e. toward the LEFT."""
    return math.degrees(math.atan2(hip[0] - foot[0], foot[1] - hip[1]))


def up(im):
    return im.resize((im.width * SS, im.height * SS), Image.NEAREST)


def rot(im, deg, center):
    # PIL rotates counter-clockwise on screen for positive angles
    return im.rotate(deg, resample=Image.NEAREST, center=(center[0] * SS, center[1] * SS))


def pose_leg(layer, hip, foot, target, flex, mode="rotate"):
    """Swing to `target` degrees forward, with the shin bent back by `flex`.

    mode "rotate" turns the shin as a rigid piece about the knee. That's
    what Einstein was built with, and it's fine on narrow trousers, but
    the corners of the cut poke out of a wide leg as jagged shards.
    mode "shear" instead slides each shin row back a little more the
    lower it sits, and carries the foot back with the ankle unchanged:
    rows stay horizontal, so the joint can't open or stick out anywhere."""
    knee = ((hip[0] + foot[0]) / 2, (hip[1] + foot[1]) / 2)
    a = up(layer)
    arr = np.array(a)
    cut = int(knee[1] * SS)
    if mode == "shear":
        leg_arr = np.zeros_like(arr)
        leg_arr[:cut] = arr[:cut]
        ankle = int((foot[1] - 14) * SS)
        t = math.tan(math.radians(flex))
        for y in range(cut, arr.shape[0]):
            sh = int(round((min(y, ankle) - cut) * t))
            if sh <= 0:
                leg_arr[y] = arr[y]
            else:
                leg_arr[y, sh:] = arr[y, :-sh]
        leg = Image.fromarray(leg_arr)
    else:
        # the thigh runs a few rows past the cut so bending the knee can't open
        # a gap at the joint — the shin tucks under the overlap instead
        thigh = arr.copy(); thigh[cut + 5 * SS:] = 0
        shin = arr.copy(); shin[:cut] = 0
        thigh, shin = Image.fromarray(thigh), Image.fromarray(shin)
        # bending the knee rotates the shin so the foot swings BACK (right),
        # which on screen is counter-clockwise: a positive PIL angle
        shin = rot(shin, flex, knee)
        leg = Image.new("RGBA", a.size, (0, 0, 0, 0))
        leg.alpha_composite(shin); leg.alpha_composite(thigh)
    # swinging FORWARD (left) is clockwise on screen: a negative PIL angle
    return rot(leg, -(target - angle_fwd(hip, foot)), hip)


def drop_specks(im, min_px=60, clean_alpha=False):
    """Remove any piece that's come loose from the figure. Rotating a cut
    layer can shear a few pixels off its edge into an island of their own;
    the figure itself is one connected shape, so anything small and
    separate from it is debris."""
    arr = np.array(im)
    A = arr[:, :, 3] > 40
    H, W = A.shape
    seen = np.zeros_like(A)
    for y in range(H):
        for x in range(W):
            if not A[y, x] or seen[y, x]:
                continue
            q = deque([(y, x)]); seen[y, x] = True; pts = []
            while q:
                cy, cx = q.popleft(); pts.append((cy, cx))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < H and 0 <= nx < W and A[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True; q.append((ny, nx))
            if len(pts) < min_px:
                for cy, cx in pts:
                    arr[cy, cx] = 0
    if clean_alpha:
        # the faint, nearly clear pixels a downscale leaves round a rotated
        # edge — invisible on their own, but they read as grit by the feet
        arr[~A] = 0
    return Image.fromarray(arr)


def frames(cfg, img, n=8, feet=None):
    """The walk cycle, as n frames on the portrait's own canvas. Pass a
    list as `feet` to get each frame's foot positions back (see stride)."""
    upper_mask, upper, groups = split(cfg, img)
    px, py = cfg["pad"]
    ground = int(img.height * SS - py * SS)
    rigs = []
    for g, (near, far) in zip(cfg["groups"], groups):
        nh, nf = joints(near)
        fh, ff = joints(far)
        a_near, a_far = angle_fwd(nh, nf), angle_fwd(fh, ff)
        amp = g.get("amp") or (abs(a_near) + abs(a_far)) / 2
        rigs.append((g, near, far, nh, nf, fh, ff, amp))

    # With more than one walker each carries their own share of the body,
    # so each can be planted on the floor separately.
    if len(rigs) == 1:
        uppers = [up(upper)]
    else:
        ua = np.array(upper)
        cols = np.arange(ua.shape[1]) - px
        uppers = []
        for g, *_ in rigs:
            keep = (cols >= g.get("x0", -10**6)) & (cols < g.get("x1", 10**6))
            part = ua.copy(); part[:, ~keep] = 0
            uppers.append(up(Image.fromarray(part)))

    out = []
    for i in range(n):
        phi = i / n * 2 * math.pi + cfg.get("phase", 0.0)
        f = None
        layers = []
        for (g, near, far, nh, nf, fh, ff, amp), U in zip(rigs, uppers):
            # the source pose is phi=0: near leg forward, far leg back
            t_near, t_far = amp * math.cos(phi), -amp * math.cos(phi)
            km = g.get("knee_max", 34)
            # a knee only bends while its leg is swinging forward
            k_near = km * max(0.0, -math.sin(phi))
            k_far = km * max(0.0, math.sin(phi))
            mode = g.get("knee", "rotate")
            L_far = pose_leg(far, fh, ff, t_far, k_far, mode)
            L_near = pose_leg(near, nh, nf, t_near, k_near, mode)
            legs = Image.new("RGBA", L_far.size, (0, 0, 0, 0))
            if cfg.get("gait") == "planted":
                # The leg pushing back (its angle falling) is the one on the
                # floor; the other is swinging through and has to clear it.
                # Planting whichever foot happens to be lowest instead
                # picked the swinging one whenever the knee bend didn't
                # raise it — a sheared knee never does — and a planted foot
                # sliding forward reads as walking backwards.
                near_stance = math.sin(phi) >= 0
                stance, swing = (L_near, L_far) if near_stance else (L_far, L_near)
                low = lambda L: np.where((np.array(L)[:, :, 3] > 40).any(axis=1))[0].max()
                dy = ground - low(stance)
                lift = int(g.get("lift", 7) * SS * abs(math.sin(phi)))
                # never let the swinging foot dip through the floor
                lift = max(lift, low(swing) + dy - ground + SS)
                legs.alpha_composite(swing if swing is L_far else stance, (0, -lift if swing is L_far else 0))
                legs.alpha_composite(swing if swing is L_near else stance, (0, -lift if swing is L_near else 0))
                if feet is not None and len(feet) <= i:
                    fn, ffar = _foot(L_near), _foot(L_far)
                    if near_stance:
                        ffar = (ffar[0], ffar[1] - lift / SS)
                    else:
                        fn = (fn[0], fn[1] - lift / SS)
                    feet.append([fn, ffar])
                layers.append((legs, U, dy))
                continue
            legs.alpha_composite(L_far); legs.alpha_composite(L_near)
            lowest = np.where((np.array(legs)[:, :, 3] > 40).any(axis=1))[0].max()
            dy = ground - lowest
            layers.append((legs, U, dy))
            if feet is not None and len(feet) <= i:
                feet.append([_foot(L_near), _foot(L_far)])
        f = Image.new("RGBA", layers[0][0].size, (0, 0, 0, 0))
        # legs behind the body, so the hem covers the hip seam
        for legs, U, dy in layers:
            f.alpha_composite(legs, (0, dy))
        for legs, U, dy in layers:
            f.alpha_composite(U, (0, dy))
        out.append(drop_specks(f.resize(img.size, Image.LANCZOS), clean_alpha=cfg.get("clean_alpha", False)))
    return out


def _foot(leg):
    """(x of the sole's middle, y of the sole) for one posed leg, at 1x."""
    al = np.array(leg)[:, :, 3] > 40
    ys = np.where(al.any(axis=1))[0]
    bot = ys.max()
    xs = np.where(al[bot - 6 * SS:bot + 1].any(axis=0))[0]
    return (xs.min() + xs.max()) / 2 / SS, bot / SS


def stride(cfg, img):
    """How far a foot travels from its most forward to its most rearward
    point across the cycle, as a fraction of the frame's width (averaged
    over the two feet) — the `stride` Customer.jsx uses to time the legs so
    the planted foot doesn't slide. Same measure the hand-checked sheets
    were given."""
    feet = []
    frames(cfg, img, feet=feet)
    spans = []
    for k in (0, 1):
        xs = [f[k][0] for f in feet]
        spans.append(max(xs) - min(xs))
    return sum(spans) / len(spans) / img.width


def sheet(fr):
    w, h = fr[0].size
    s = Image.new("RGBA", (w * len(fr), h), (0, 0, 0, 0))
    for i, f in enumerate(fr):
        s.paste(f, (i * w, 0))
    return s


# ---------------------------------------------------------------- recolour

def _hsv(rgb):
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    d = mx - mn
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.zeros_like(mx)
    m = d > 1e-6
    rr = m & (mx == r); gg = m & (mx == g) & ~rr; bb = m & ~rr & ~gg
    h[rr] = ((g - b)[rr] / d[rr]) % 6
    h[gg] = (b - r)[gg] / d[gg] + 2
    h[bb] = (r - g)[bb] / d[bb] + 4
    return h * 60, s, mx


def garment_mask(cfg, img):
    rc = cfg["recolor"]
    a = np.array(img).astype(np.float32)
    h, s, v = _hsv(a[:, :, :3] / 255.0)
    lo, hi = rc.get("hue", (4, 28))
    sel = (a[:, :, 3] > 40) & (s > rc.get("sat", 0.58)) & (h >= lo) & (h <= hi) & (v > rc.get("val", 0.18))
    H, W = v.shape
    Y, X = np.mgrid[0:H, 0:W]
    if rc.get("fig_coords"):
        px, py = cfg["pad"]
        X, Y = X - px, Y - py
    for x0, y0, x1, y1 in rc.get("protect", []):
        sel &= ~((X >= x0) & (X < x1) & (Y >= y0) & (Y < y1))
    seeds = rc.get("seeds")
    if seeds:
        # Keep only the patches of garment colour that touch a seed. Skin
        # can sit in exactly the fabric's hue and saturation (the mom's
        # arms do), but it's walled off from the fabric by outline, so
        # connectivity separates what colour can't.
        from scipy import ndimage
        lab, _ = ndimage.label(sel)
        ox, oy = cfg["pad"] if rc.get("fig_coords") else (0, 0)
        keep = {lab[y + oy, x + ox] for x, y in seeds} - {0}
        sel = np.isin(lab, list(keep))
    for x0, y0, x1, y1 in rc.get("include", []):
        # boxes where the garment's colour dips out of range (deep folds)
        # but is still plainly part of it
        box = (X >= x0) & (X < x1) & (Y >= y0) & (Y < y1)  # noqa
        sel |= box & (a[:, :, 3] > 40) & (s > rc.get("include_sat", 0.3)) & (h >= lo - 10) & (h <= hi + 10)
    return sel


def to_pink(cfg, img):
    """Orange garment -> pink garment, touching nothing else."""
    rc = cfg["recolor"]
    a = np.array(img).astype(np.float32)
    h, s, v = _hsv(a[:, :, :3] / 255.0)
    sel = garment_mask(cfg, img)
    # a dusty rose rather than a hot pink, matching the "In the Hay" tap
    nh = np.where(sel, rc.get("target", 338.0), h)
    ns = np.where(sel, s * rc.get("sat_mul", 0.72), s)
    nv = np.where(sel, np.minimum(1.0, v * rc.get("val_mul", 1.10)), v)
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
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


# ---------------------------------------------------------------- props

def held(cfg, fig, colour):
    """The very same glass art the player taps, placed in the forward hand.
    It goes BEHIND the figure so the fingers read as wrapped round it."""
    hx, hy = cfg["hand"]
    glass = Image.open(f"{ART}/drink-{colour}.png").convert("RGBA")
    gh = cfg.get("glass_h", 70)
    gw = round(glass.width * gh / glass.height)
    glass = glass.resize((gw, gh), Image.LANCZOS)
    out = Image.new("RGBA", fig.size, (0, 0, 0, 0))
    pos = (hx - gw // 2, hy - int(gh * 0.62))
    if cfg.get("props_front"):
        # a hand held down against the body would hide the glass behind it
        out.alpha_composite(fig); out.alpha_composite(glass, pos)
    else:
        out.alpha_composite(glass, pos); out.alpha_composite(fig)
    return out


SPRAY_W = 390      # every spray frame is this wide, so the game can size
                   # them all alike; the figure sits SPRAY_PAD in from the left
SPRAY_PAD = 92     # room in front of them for the jet
SPRAY_FRAMES = 8
SIPHON_H = 50      # the siphon's height on the 279px canvas

JET_WHITE = (246, 252, 255, 255)
JET_BLUE = (158, 210, 238, 255)
JET_DEEP = (96, 164, 214, 255)


def _siphon():
    """The PixelLab siphon, scaled to size, with where its spout tip and the
    neck (where a hand grips it) are."""
    im = Image.open(os.path.join(HERE, "siphon.png")).convert("RGBA")
    im = im.crop(im.getbbox())
    h = SIPHON_H
    w = round(im.width * h / im.height)
    im = im.resize((w, h), Image.NEAREST if im.height < h else Image.LANCZOS)
    a = np.array(im)[:, :, 3] > 40
    top = a[: h // 3]
    ys, xs = np.where(top)
    tip = (int(xs.min()), int(ys[xs.argmin()]))
    # the neck: the narrowest row just below the head
    widths = [(a[y].sum(), y) for y in range(h // 5, h // 2) if a[y].any()]
    neck_y = min(widths)[1]
    neck_x = int(np.where(a[neck_y])[0].mean())
    return im, tip, (neck_x, neck_y)


def _jet_frame(draw, nozzle, phase, rnd_seed=11):
    """One frame of the seltzer blast, from `nozzle` off to the left edge:
    a pressurised core that pulses, breaking up into droplets that fan out
    and drop a little as they go, and a splash where it lands.

    Drawn chunky on purpose: the spray is shown at about a third of this
    size, so anything a pixel or two across simply vanishes."""
    import random
    nx, ny = nozzle
    reach = nx - 4
    arc = lambda d: ny + 0.0022 * d * d  # it falls a little as it goes

    def blob(x, y, col, s):
        x, y = round(x), round(y)
        draw.rectangle([x - s // 2, y - s // 2, x - s // 2 + s - 1, y - s // 2 + s - 1], fill=col)

    # the core: solid out of the spout, its length pulsing with the pressure
    core = 26 + 10 * (0.5 + 0.5 * math.sin(phase * 2 * math.pi))
    for d in range(0, int(core)):
        y = arc(d)
        half = 2 + min(2, d // 6)       # swells a little as it leaves the spout
        draw.rectangle([nx - d, round(y) - half - 1, nx - d, round(y) + half + 1], fill=JET_BLUE)
        draw.rectangle([nx - d, round(y) - half, nx - d, round(y) + half - 1], fill=JET_WHITE)
    rnd = random.Random(rnd_seed)
    # droplets: each has a fixed line in the fan and its own point in the
    # cycle, so from frame to frame they visibly fly outward
    start = core * 0.7
    for _ in range(110):
        off, u, sp = rnd.random(), rnd.uniform(-1, 1), rnd.uniform(0.9, 1.1)
        t = ((phase * sp) + off) % 1.0
        d = start + t * (reach - start)
        if nx - d < 2:
            continue
        spread = 3 + (d - start) * 0.34
        y = arc(d) + u * spread
        size = 5 if t < 0.35 else 4 if t < 0.7 else 3
        if rnd.random() < 0.25:
            size -= 1
        col = JET_WHITE if rnd.random() < 0.55 else (JET_BLUE if rnd.random() < 0.8 else JET_DEEP)
        blob(nx - d, y, col, size)
    # the splash, where it hits: spray thrown back up and down off the target
    sx, sy = 6, arc(reach)
    for _ in range(26):
        ang = rnd.uniform(-1.3, 1.3)
        r = ((phase + rnd.random()) % 1.0) * 22
        x = sx + abs(math.cos(ang)) * r * 0.5
        y = sy + math.sin(ang) * r
        blob(x, y, JET_WHITE if rnd.random() < 0.6 else JET_BLUE, 4 if r < 11 else 3)


def spray(cfg, fig):
    """The patron leaning in with a seltzer siphon, mid-blast: SPRAY_FRAMES
    frames, each SPRAY_W wide, the jet animating across them."""
    sip, tip, neck = _siphon()
    W, H = fig.size
    hx, hy = cfg["hand"]
    hx += SPRAY_PAD
    # the hand grips the neck, spout forward
    sx, sy = hx - neck[0], hy - neck[1]
    nozzle = (sx + tip[0] - 1, sy + tip[1])
    front = cfg.get("props_front")
    frames = []
    for f in range(SPRAY_FRAMES):
        out = Image.new("RGBA", (SPRAY_W, H), (0, 0, 0, 0))
        if front:
            out.alpha_composite(fig, (SPRAY_PAD, 0))
            out.alpha_composite(sip, (sx, sy))
        else:
            out.alpha_composite(sip, (sx, sy))
            out.alpha_composite(fig, (SPRAY_PAD, 0))
        _jet_frame(ImageDraw.Draw(out), nozzle, f / SPRAY_FRAMES)
        frames.append(out)
    return frames


# ---------------------------------------------------------------- build

def build(cfg, out_dir=ART):
    """Write the full set of eight files for one patron."""
    base = load(cfg)
    names = cfg["names"]  # {'portrait': 'patron5', 'spray': 'spray-patron5'}
    for colour in ("orange", "pink"):
        fig = base if colour == "orange" else to_pink(cfg, base)
        fig.save(f"{out_dir}/{names['portrait']}-{colour}.png")
        held(cfg, fig, colour).save(f"{out_dir}/{names['portrait']}-{colour}-held.png")
        sheet(spray(cfg, fig)).save(f"{out_dir}/{names['spray']}-{colour}.png")
        sheet(frames(cfg, fig)).save(f"{out_dir}/{names['portrait']}-{colour}-walk.png")
    return base.size
