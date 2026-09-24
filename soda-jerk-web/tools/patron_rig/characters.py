"""Per-character rig settings. Coordinates are explained in rig.py.

Every patron is 267px tall as a figure (89 CSS px at 3x), on a canvas
padded 6px top and bottom, so they all stand at one scale in the game.
"""

FIG_H = 267

EINSTEIN = {
    "names": {"portrait": "patron5", "spray": "spray-patron5"},
    "source": "einstein.png",
    "mirror": True,
    "fig_h": FIG_H,
    "pad": (24, 6),
    "groups": [{
        "hem": 150, "crotch": 197, "seam": ((100, 152), (73, 197)),
        # the trailing hand dips into the leg rows on the right; it's body
        "upper_boxes": [(104, -10**6, 10**6, 170)],
    }],
    "recolor": {
        "hue": (4, 28),
        # skin, so a saturated knuckle shadow can't turn pink
        "protect": [
            (0, 0, 999, 60),        # face, hair, collar-up
            (26, 132, 47, 158),     # forward hand only, not its cuff
            (126, 152, 160, 180),   # trailing hand only, not its cuff
        ],
    },
    "hand": (38, 142),
    "gait": "planted",
}


def patron(names, source, groups, hand, protect=(), hue=(18, 40), seeds=None,
           include=(), sat=0.5, val=0.18, **extra):
    cfg = {
        "names": names,
        "source": source,
        "fig_h": FIG_H,
        "pad": (24, 6),
        "groups": groups,
        "recolor": {"hue": hue, "sat": sat, "val": val, "protect": list(protect), "fig_coords": True,
                    "seeds": seeds, "include": list(include)},
        "hand": hand,
    }
    cfg["clean_alpha"] = True
    cfg["gait"] = "planted"
    for g in groups:
        g.setdefault("seam", "auto")
        g.setdefault("extend_top", 8)
        g.setdefault("knee", "shear")
        # the far thigh is hidden behind the near one all the way down to
        # the crotch; rebuild all of it, or its ragged edge shows mid-swing
        # With the auto seam each leg already owns the whole thigh wedge,
        # so there's no hidden far thigh to rebuild.
        g.setdefault("fill_rows", 0)
    cfg.update(extra)
    return cfg


BIG = 10**6

MAN = patron(
    {"portrait": "patron", "spray": "spray"}, "man.png",
    [{"hem": 150, "crotch": 188, "upper_boxes": [(110, 125, BIG, 172)]}],
    hand=(38, 114),
    # face and hat; forward hand; everything from the jacket hem down
    # (the trousers are a dark brown that sits in the jacket's hue range)
    protect=[(0, 0, BIG, 46), (45, 0, 82, 56), (0, 95, 33, 125), (0, 152, BIG, BIG)],
)

MOM = patron(
    {"portrait": "patron2", "spray": "spray-patron2"}, "mom.png",
    [
        {"x0": 0, "x1": 148, "hem": 217, "crotch": 217, "split_x": 70, "knee_max": 0, "extend_top": 14},
        {"x0": 148, "x1": BIG, "hem": 222, "crotch": 222, "split_x": 200, "knee_max": 0, "extend_top": 10},
    ],
    hand=(34, 98),
    # dress and hat; the son's striped shirt is too broken up by its white
    # stripes to flood from one seed, so it's boxed in instead
    seeds=[(95, 170), (80, 150), (60, 195), (90, 15), (100, 25)],
    include=[(178, 152, 214, 192)],
    protect=[(0, 214, BIG, BIG)],  # legs below the hem
)

DAPPER = patron(
    {"portrait": "patron3", "spray": "spray-patron3"}, "dapper.png",
    [{"hem": 150, "crotch": 192, "upper_boxes": [(128, 125, BIG, 172)], "knee_max": 30}],
    hand=(34, 72),
    # the whole suit goes pink, trousers too; not the face, hands or shoes
    protect=[(0, 0, BIG, 40), (70, 38, 108, 58), (0, 50, 26, 78), (130, 140, BIG, 175)],
    val=0.42,
)

CHAPLIN = patron(
    {"portrait": "patron4", "spray": "spray-patron4"}, "chaplin.png",
    [{"hem": 160, "crotch": 205, "upper_boxes": [(95, 100, BIG, 185), (28, 150, 50, 176)], "knee_max": 30}],
    hand=(64, 170),
    props_front=True,
    # The one patron who keeps the original rig's gait, which reads as a
    # shuffle that slips backwards — right for him and nobody else.
    gait="lowest",
    protect=[(0, 0, BIG, 62), (128, 100, BIG, 135)],
)

AVIATOR = patron(
    {"portrait": "patron6", "spray": "spray-patron6"}, "aviator.png",
    [{"hem": 125, "crotch": 180, "upper_boxes": [(0, 110, 32, 152)]}],
    hand=(36, 140),
    seeds=[(60, 90), (45, 75), (75, 110)],
)

ESCAPIST = patron(
    {"portrait": "patron7", "spray": "spray-patron7"}, "escapist.png",
    [{"hem": 142, "crotch": 200, "upper_boxes": [(95, 128, BIG, 165), (28, 128, 46, 152)]}],
    hand=(62, 84),
    seeds=[(70, 100), (80, 80), (60, 120)],
)

BOSS = patron(
    {"portrait": "patron8", "spray": "spray-patron8"}, "boss.png",
    [{"hem": 172, "crotch": 205, "upper_boxes": [(0, 150, 40, 192)]}],
    hand=(44, 176),
    props_front=True,
    seeds=[(80, 110), (75, 140), (85, 95)],
)

# An original 1950s TV-show clown (PixelLab, clown.png). His suit is one
# piece with baggy legs that overlap with no gap between them, so the
# thighs are split along the far leg's outline by hand.
CLOWN = patron(
    {"portrait": "patron9", "spray": "spray-patron9"}, "clown.png",
    [{"hem": 172, "crotch": 246, "seam": ((122, 172), (106, 244)),
      "upper_boxes": [(118, 138, BIG, 176)], "knee_max": 26}],
    hand=(46, 139),
    seeds=[(100, 110), (70, 210), (140, 215), (130, 100), (60, 130)],
    # the far leg's deep shading runs redder than the rest of the suit;
    # the seeds keep that wider range off his red hair and shoes
    hue=(10, 40), val=0.12,
)

# A 1920s home-run slugger in pinstripes (PixelLab, slugger.png; drawn
# facing right, so mirrored).
SLUGGER = patron(
    {"portrait": "patron10", "spray": "spray-patron10"}, "slugger.png",
    [{"hem": 142, "crotch": 212}],
    hand=(34, 116),
    mirror=True,
    seeds=[(80, 100), (60, 170), (100, 170), (70, 10), (100, 130), (60, 125)],
    # the bat's wood sits in the uniform's orange and touches it
    protect=[(98, 5, BIG, 48), (15, 55, 52, 92)],
    # the belly and his back edge are shaded a deeper orange than the rest
    hue=(10, 40), val=0.12,
    include=[(40, 105, 78, 142)],
)

# A prohibition agent in a trench coat, badge out (PixelLab, gman.png;
# drawn facing right, so mirrored). The drink goes in the badge hand.
GMAN = patron(
    {"portrait": "patron11", "spray": "spray-patron11"}, "gman.png",
    [{"hem": 197, "crotch": 216}],
    hand=(47, 98),
    mirror=True,
    seeds=[(70, 150), (90, 80), (60, 60), (100, 120), (50, 180)],
)

# A flapper in a fringed drop-waist dress (PixelLab, flapper.png; drawn
# facing right, so mirrored). Only her trailing arm shows, so the drink is
# drawn in front of her, like Chaplin's.
FLAPPER = patron(
    {"portrait": "patron12", "spray": "spray-patron12"}, "flapper.png",
    [{"hem": 199, "crotch": 214}],
    hand=(60, 118),
    mirror=True,
    props_front=True,
    seeds=[(50, 100), (60, 170), (40, 150), (60, 75)],
    # the fringe breaks into strands too small to flood from a seed
    include=[(20, 138, 78, 195)],
)

CHARACTERS = {
    "einstein": EINSTEIN,
    "man": MAN,
    "mom": MOM,
    "dapper": DAPPER,
    "chaplin": CHAPLIN,
    "aviator": AVIATOR,
    "escapist": ESCAPIST,
    "boss": BOSS,
    "clown": CLOWN,
    "slugger": SLUGGER,
    "gman": GMAN,
    "flapper": FLAPPER,
}
