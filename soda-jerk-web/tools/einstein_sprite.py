"""Hand-built pixel-art Einstein.

Drawn at a native 68x128 grid from a posable skeleton, so every frame is the
same character, the two outfit colours are a pure palette swap, and the walk
cycle's stride is whatever the joint angles say it is.
"""
import math
from PIL import Image, ImageDraw

W, H = 68, 128
GROUND = 125

OUTLINE = (34, 24, 30)
SKIN = (236, 190, 156)
SKIN_SH = (204, 150, 116)
HAIR = (244, 244, 240)
HAIR_SH = (192, 196, 208)
SHIRT = (242, 238, 226)
TIE = (104, 64, 46)
TROUSER = (118, 106, 96)
TROUSER_SH = (88, 78, 72)
SHOE = (98, 58, 34)
SHOE_SH = (66, 38, 22)
EYE = (40, 30, 34)

OUTFITS = {
    'orange': dict(main=(214, 122, 42), shade=(166, 84, 28), light=(240, 160, 76)),
    'pink': dict(main=(214, 104, 148), shade=(168, 70, 110), light=(240, 144, 180)),
}


def vec(angle_deg, length):
    """Direction from a joint. 0 = straight down; positive swings FORWARD,
    and forward is to the LEFT because he walks left."""
    a = math.radians(angle_deg)
    return (-math.sin(a) * length, math.cos(a) * length)


def add(p, v):
    return (p[0] + v[0], p[1] + v[1])


def capsule(d, a, b, width, fill, outline=OUTLINE):
    """A limb segment: outline pass first, fill on top, round joints."""
    for w, col in ((width + 2, outline), (width, fill)):
        d.line([a, b], fill=col, width=w)
        r = w / 2
        for p in (a, b):
            d.ellipse([p[0] - r + 0.5, p[1] - r + 0.5, p[0] + r - 0.5, p[1] + r - 0.5], fill=col)


def pose(phase):
    """Joint positions for one moment of the walk. `phase` is 0..2pi."""
    s, c = math.sin(phase), math.cos(phase)
    legs = []
    for sign in (1, -1):  # near leg, far leg
        thigh = 26 * s * sign
        # The knee bends through the swing — while the thigh is travelling
        # forward — and stays near straight while the foot is planted.
        swing = c * sign
        knee_flex = 38 * max(0.0, swing) + 4
        legs.append((thigh, knee_flex))
    arm_swing = -24 * s  # arms counter the legs
    return legs, arm_swing


def build(phase, outfit_key, bob=True, near_arm=None):
    o = OUTFITS[outfit_key]
    legs, arm_swing = pose(phase)

    # Caricature proportions: big head, stocky body, short legs. The first
    # draft used realistic leg length and he came out on stilts.
    hip = (35, 84)
    thigh_len, shin_len = 17, 17

    def leg_points(thigh, flex):
        knee = add(hip, vec(thigh * 0.85, thigh_len))
        ankle = add(knee, vec(thigh * 0.85 - flex, shin_len))
        return knee, ankle

    near_knee, near_ankle = leg_points(*legs[0])
    far_knee, far_ankle = leg_points(*legs[1])

    lowest = max(near_ankle[1], far_ankle[1])
    dy = (GROUND - 4) - lowest
    shift = lambda p: (p[0], p[1] + dy)
    hip = shift(hip)
    near_knee, near_ankle = shift(near_knee), shift(near_ankle)
    far_knee, far_ankle = shift(far_knee), shift(far_ankle)

    shoulder = (hip[0] - 4, hip[1] - 31)
    head_c = (shoulder[0] - 3, shoulder[1] - 15)

    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def arm(angle, fill, cuff, hand):
        elbow = add(shoulder, vec(angle * 0.9, 14))
        wrist = add(elbow, vec(angle * 0.9 + 22, 13))
        capsule(d, shoulder, elbow, 8, fill)
        capsule(d, elbow, wrist, 7, fill)
        # cardigan cuff
        cx, cy = wrist
        d.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=OUTLINE)
        d.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=cuff)
        hx, hy = add(wrist, vec(angle * 0.9 + 22, 3))
        d.ellipse([hx - 3.5, hy - 3.5, hx + 3.5, hy + 3.5], fill=OUTLINE)
        d.ellipse([hx - 2.5, hy - 2.5, hx + 2.5, hy + 2.5], fill=hand)
        return (hx, hy)

    def leg(knee, ankle, fill, crease, shoe, shoe_hi):
        # baggy trousers: wide at the thigh, a turn-up at the ankle
        capsule(d, hip, knee, 11, fill)
        capsule(d, knee, ankle, 10, fill)
        d.line([add(hip, (0, 3)), knee], fill=crease, width=1)
        d.line([knee, ankle], fill=crease, width=1)
        ax, ay = ankle
        d.rectangle([ax - 5, ay - 1, ax + 5, ay + 1], fill=crease)
        # a proper brogue: long toe pointing forward (left)
        pts = [(ax + 4, ay), (ax + 4, ay + 4), (ax - 9, ay + 4), (ax - 10, ay + 2), (ax - 7, ay)]
        d.polygon([(x, y) for x, y in pts], fill=shoe, outline=OUTLINE)
        d.line([(ax - 7, ay + 1), (ax + 2, ay + 1)], fill=shoe_hi, width=1)

    # ---- far side, in shade ----
    arm(-arm_swing, o['shade'], o['shade'], SKIN_SH)
    leg(far_knee, far_ankle, TROUSER_SH, (70, 62, 58), SHOE_SH, SHOE)

    # ---- torso: a stocky cardigan ----
    sx, sy = shoulder
    hx0, hy0 = hip
    body = [(sx - 10, sy + 2), (sx - 4, sy - 2), (sx + 9, sy - 1), (sx + 12, sy + 6),
            (hx0 + 12, hy0 - 2), (hx0 + 11, hy0 + 4), (hx0 - 11, hy0 + 5), (hx0 - 12, hy0 - 3)]
    d.polygon(body, fill=o['main'], outline=OUTLINE, width=1)
    # shade the back half of the cardigan
    back = [(sx + 3, sy - 1), (sx + 9, sy - 1), (sx + 12, sy + 6), (hx0 + 12, hy0 - 2),
            (hx0 + 11, hy0 + 4), (hx0 + 5, hy0 + 4)]
    d.polygon(back, fill=o['shade'])
    d.polygon(body, outline=OUTLINE)
    # shirt and tie in the V-neck
    d.polygon([(sx - 7, sy + 1), (sx - 1, sy - 1), (sx - 4, sy + 16)], fill=SHIRT)
    d.polygon([(sx - 5, sy + 2), (sx - 3, sy + 1), (sx - 3, sy + 13), (sx - 4, sy + 15), (sx - 5, sy + 13)], fill=TIE)
    # button placket and buttons
    d.line([(sx - 4, sy + 16), (hx0 - 7, hy0 + 4)], fill=OUTLINE, width=1)
    for k in range(4):
        t = (k + 1) / 5
        bx = (sx - 4) + ((hx0 - 7) - (sx - 4)) * t
        by = (sy + 16) + ((hy0 + 4) - (sy + 16)) * t
        d.point((bx - 1, by), fill=o['light'])
    # a patch pocket
    d.rectangle([hx0 - 9, hy0 - 10, hx0 - 3, hy0 - 5], outline=o['shade'])
    # knit ribbing at the hem
    for k in range(-10, 11, 2):
        d.point((hx0 + k, hy0 + 2), fill=o['shade'])
    # a highlight down the front
    d.line([(sx - 8, sy + 4), (hx0 - 10, hy0 - 4)], fill=o['light'], width=1)

    # ---- near leg ----
    leg(near_knee, near_ankle, TROUSER, TROUSER_SH, SHOE, (140, 92, 58))

    # ---- head: big, as a caricature should be ----
    hx, hy = head_c
    # the hair, wild and huge, behind the head
    tufts = [(5, -7, 9), (9, 0, 8), (1, -11, 8), (-5, -10, 6), (10, 7, 6),
             (8, -11, 6), (13, -4, 5), (-8, -6, 4)]
    for tx, ty, r in tufts:
        d.ellipse([hx + tx - r - 1, hy + ty - r - 1, hx + tx + r + 1, hy + ty + r + 1], fill=OUTLINE)
    for tx, ty, r in tufts:
        d.ellipse([hx + tx - r, hy + ty - r, hx + tx + r, hy + ty + r], fill=HAIR)
    # shadow on the underside of the cloud
    for tx, ty, r in tufts:
        d.arc([hx + tx - r, hy + ty - r, hx + tx + r, hy + ty + r], 20, 150, fill=HAIR_SH)
    # flyaway wisps
    for sx2, sy2 in [(20, -8), (18, 3), (16, -16), (6, -21), (-6, -18), (-11, -12), (19, 11), (13, -20)]:
        d.line([(hx + sx2 * 0.62, hy + sy2 * 0.62), (hx + sx2, hy + sy2)], fill=HAIR, width=2)
        d.point((hx + sx2, hy + sy2), fill=HAIR_SH)

    # face in profile, facing left
    d.ellipse([hx - 11, hy - 9, hx + 7, hy + 11], fill=OUTLINE)
    d.ellipse([hx - 10, hy - 8, hx + 6, hy + 10], fill=SKIN)
    # jaw and cheek shading toward the back
    d.pieslice([hx - 10, hy - 8, hx + 6, hy + 10], 300, 60, fill=SKIN_SH)
    d.ellipse([hx - 9, hy - 7, hx + 2, hy + 9], fill=SKIN)
    # a big, friendly nose
    d.polygon([(hx - 9, hy - 2), (hx - 15, hy + 4), (hx - 13, hy + 6), (hx - 9, hy + 5)], fill=SKIN, outline=OUTLINE)
    d.point((hx - 12, hy + 5), fill=SKIN_SH)
    # ear
    d.ellipse([hx + 1, hy - 1, hx + 6, hy + 6], fill=SKIN_SH, outline=OUTLINE)
    d.point((hx + 3, hy + 2), fill=OUTLINE)
    # bushy white brow over a smiling, crinkled eye
    d.polygon([(hx - 11, hy - 4), (hx - 3, hy - 6), (hx - 2, hy - 3), (hx - 10, hy - 2)], fill=HAIR, outline=OUTLINE)
    d.line([(hx - 8, hy), (hx - 5, hy - 1)], fill=EYE, width=1)
    d.point((hx - 5, hy + 1), fill=SKIN_SH)
    d.point((hx - 4, hy + 2), fill=SKIN_SH)
    # the mustache — big, white, drooping
    d.polygon([(hx - 14, hy + 6), (hx - 5, hy + 5), (hx - 3, hy + 8), (hx - 6, hy + 11), (hx - 13, hy + 10)],
              fill=HAIR, outline=OUTLINE)
    d.line([(hx - 12, hy + 9), (hx - 6, hy + 9)], fill=HAIR_SH, width=1)
    # chin under it
    d.point((hx - 9, hy + 12), fill=OUTLINE)
    # hair spilling over the back of the collar
    d.ellipse([hx + 3, hy + 4, hx + 12, hy + 14], fill=OUTLINE)
    d.ellipse([hx + 4, hy + 5, hx + 11, hy + 13], fill=HAIR)

    # ---- near arm over everything ----
    wrist = arm(arm_swing if near_arm is None else near_arm, o['main'], o['light'], SKIN)
    return img, wrist


def upscale(img, k):
    return img.resize((img.width * k, img.height * k), Image.NEAREST)


def with_prop(phase, outfit_key, near_arm, prop_fn, pad_left=0, pad_top=0):
    """Draw him, then a held prop at his hand, on a canvas with room for it.
    The prop goes BEHIND the figure so his hand reads as gripping it."""
    fig, hand = build(phase, outfit_key, near_arm=near_arm)
    w, h = fig.width + pad_left, fig.height + pad_top
    canvas = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)
    prop_fn(d, (hand[0] + pad_left, hand[1] + pad_top), outfit_key)
    canvas.alpha_composite(fig, (pad_left, pad_top))
    # re-stamp the hand on top so the fingers wrap the prop
    hx, hy = hand[0] + pad_left, hand[1] + pad_top
    d = ImageDraw.Draw(canvas)
    d.ellipse([hx - 3.5, hy - 3.5, hx + 3.5, hy + 3.5], fill=OUTLINE)
    d.ellipse([hx - 2.5, hy - 2.5, hx + 2.5, hy + 2.5], fill=SKIN)
    return canvas


SODA = {'orange': ((226, 130, 40), (250, 176, 80)), 'pink': ((214, 70, 110), (240, 120, 150))}


def soda_glass(d, hand, outfit_key):
    """A tall footed soda glass, in the colour he ordered, with foam and a straw."""
    liquid, light = SODA[outfit_key]
    x, y = hand
    top, bot = y - 17, y + 6
    # glass body, tapering toward the foot
    d.polygon([(x - 6, top), (x + 5, top), (x + 3, bot), (x - 4, bot)], fill=OUTLINE)
    d.polygon([(x - 5, top + 1), (x + 4, top + 1), (x + 2, bot - 1), (x - 3, bot - 1)], fill=liquid)
    d.line([(x - 4, top + 3), (x - 2, bot - 2)], fill=light, width=1)
    # foam
    d.ellipse([x - 7, top - 4, x + 6, top + 3], fill=OUTLINE)
    d.ellipse([x - 6, top - 3, x + 5, top + 2], fill=(248, 240, 222))
    # foot
    d.rectangle([x - 1, bot, x, bot + 2], fill=OUTLINE)
    d.rectangle([x - 4, bot + 2, x + 3, bot + 3], fill=OUTLINE)
    # straw, red and white
    for k in range(8):
        d.point((x + 2 + k // 3, top - 4 - k), fill=(210, 44, 44) if k % 2 else (248, 248, 248))


def siphon(d, hand, outfit_key):
    """A seltzer siphon pointed left, and the blast coming out of it."""
    x, y = hand
    # glass bottle body below the grip
    d.rounded_rectangle([x - 5, y - 2, x + 5, y + 16], radius=3, fill=OUTLINE)
    d.rounded_rectangle([x - 4, y - 1, x + 4, y + 15], radius=2, fill=(126, 170, 196))
    d.line([(x - 2, y + 1), (x - 2, y + 13)], fill=(196, 226, 240), width=1)
    # chrome head and lever
    d.rectangle([x - 4, y - 7, x + 4, y - 2], fill=OUTLINE)
    d.rectangle([x - 3, y - 6, x + 3, y - 3], fill=(200, 204, 212))
    d.line([(x + 1, y - 7), (x + 6, y - 10)], fill=OUTLINE, width=2)
    # nozzle pointing left
    nx, ny = x - 9, y - 5
    d.rectangle([nx, ny - 1, x - 3, ny + 1], fill=OUTLINE)
    # the spray: a solid jet out of the nozzle that breaks up into a
    # widening fan of droplets toward the left edge
    import random
    rnd = random.Random(7)
    # core stream
    d.line([(nx, ny), (nx - 16, ny - 1)], fill=(170, 214, 240), width=3)
    d.line([(nx, ny), (nx - 16, ny - 1)], fill=(236, 248, 255), width=1)
    for k in range(220):
        t = rnd.random() ** 0.8
        dist = 6 + t * (nx - 2)
        spread = 1 + t * 12
        px = nx - dist
        py = ny + rnd.uniform(-spread, spread) - t * 2
        if px < 0:
            continue
        col = (240, 250, 255) if rnd.random() < 0.65 else (160, 208, 238)
        d.point((px, py), fill=col)
        if rnd.random() < 0.35:
            d.point((px - 1, py), fill=col)
