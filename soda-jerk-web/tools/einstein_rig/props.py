"""The held soda glass and the seltzer siphon, at this sprite's scale."""
import random
from PIL import Image, ImageDraw

ART = __import__("os").path.join(__import__("os").path.dirname(__import__("os").path.abspath(__file__)), "..", "..", "public", "art")
HAND = (38, 142)   # his forward hand, in canvas coords

def held(fig, colour):
    """The very same glass art the player taps, placed in his forward hand.
    It goes BEHIND the figure so his fingers read as wrapped round it."""
    glass = Image.open(f"{ART}/drink-{colour}.png").convert("RGBA")
    gh = 70
    gw = round(glass.width * gh / glass.height)
    glass = glass.resize((gw, gh), Image.LANCZOS)
    out = Image.new("RGBA", fig.size, (0, 0, 0, 0))
    out.alpha_composite(glass, (HAND[0] - gw // 2, HAND[1] - int(gh * 0.62)))
    out.alpha_composite(fig)
    return out

OUTLINE = (34, 24, 30, 255)

def spray(fig, pad_left=92):
    """A seltzer siphon in his forward hand, aimed left, mid-blast."""
    W, H = fig.size
    out = Image.new("RGBA", (W + pad_left, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)
    hx, hy = HAND[0] + pad_left, HAND[1]
    # bottle hangs below the grip; glass body with a highlight
    d.rounded_rectangle([hx - 9, hy - 2, hx + 9, hy + 34], radius=6, fill=OUTLINE)
    d.rounded_rectangle([hx - 7, hy, hx + 7, hy + 32], radius=5, fill=(104, 150, 178, 255))
    d.rounded_rectangle([hx - 5, hy + 3, hx - 1, hy + 28], radius=2, fill=(170, 210, 230, 255))
    d.line([(hx + 4, hy + 4), (hx + 4, hy + 28)], fill=(74, 112, 138, 255), width=2)
    # the chrome siphon head and its lever
    d.rectangle([hx - 8, hy - 13, hx + 8, hy - 1], fill=OUTLINE)
    d.rectangle([hx - 6, hy - 11, hx + 6, hy - 3], fill=(206, 210, 218, 255))
    d.line([(hx - 5, hy - 10), (hx + 4, hy - 10)], fill=(246, 248, 250, 255), width=1)
    d.line([(hx + 2, hy - 13), (hx + 12, hy - 20)], fill=OUTLINE, width=4)
    d.line([(hx + 2, hy - 13), (hx + 12, hy - 20)], fill=(190, 194, 204, 255), width=2)
    # nozzle aimed left
    nx, ny = hx - 16, hy - 8
    d.rectangle([nx, ny - 2, hx - 7, ny + 2], fill=OUTLINE)
    d.rectangle([nx + 1, ny - 1, hx - 8, ny + 1], fill=(190, 194, 204, 255))
    # the blast: a solid jet that breaks up into a widening fan of droplets
    rnd = random.Random(11)
    d.line([(nx, ny), (nx - 30, ny - 2)], fill=(160, 208, 236, 255), width=5)
    d.line([(nx, ny), (nx - 30, ny - 2)], fill=(238, 248, 255, 255), width=2)
    for _ in range(900):
        t = rnd.random() ** 0.75
        dist = 10 + t * (nx - 3)
        spread = 2 + t * 26
        px, py = nx - dist, ny + rnd.uniform(-spread, spread) - t * 4
        if px < 1:
            continue
        col = (242, 250, 255, 255) if rnd.random() < 0.62 else (156, 206, 236, 255)
        r = 1.6 if t < 0.45 and rnd.random() < 0.5 else 0.6
        d.ellipse([px - r, py - r, px + r, py + r], fill=col)
    out.alpha_composite(fig, (pad_left, 0))
    return out
