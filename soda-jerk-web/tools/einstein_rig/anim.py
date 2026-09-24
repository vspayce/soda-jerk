"""Cut-out walk cycle: swing each leg about its hip, bend it at the knee,
and plant whichever foot is lowest so the stance foot stays on the floor."""
import math
from PIL import Image
import numpy as np
from seg import load, split

SS = 3  # rotate at 3x so the cut edges don't go ragged

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

def pose_leg(layer, hip, foot, target, flex):
    """Swing to `target` degrees forward, with the shin bent back by `flex`."""
    knee = ((hip[0] + foot[0]) / 2, (hip[1] + foot[1]) / 2)
    a = up(layer)
    arr = np.array(a)
    cut = int(knee[1] * SS)
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

def drop_specks(im, min_px=60):
    """Remove any piece that's come loose from the figure. Rotating a cut
    layer can shear a few pixels off its edge into an island of their own;
    the figure itself is one connected shape, so anything small and
    separate from it is debris."""
    from collections import deque
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
    return Image.fromarray(arr)


def frames(n=8, amp=None, knee_max=34, recolor=None):
    img = load()
    if recolor:
        img = recolor(img)[0]
    upper, near, far = split(img)
    nh, nf = joints(near)
    fh, ff = joints(far)
    a_near, a_far = angle_fwd(nh, nf), angle_fwd(fh, ff)
    amp = amp or (abs(a_near) + abs(a_far)) / 2
    ground = int(img.height * SS - 6 * SS)
    out = []
    for i in range(n):
        phi = i / n * 2 * math.pi
        # the source pose is phi=0: near leg forward, far leg back
        t_near, t_far = amp * math.cos(phi), -amp * math.cos(phi)
        # a knee only bends while its leg is swinging forward
        k_near = knee_max * max(0.0, -math.sin(phi))
        k_far = knee_max * max(0.0, math.sin(phi))
        L_far = pose_leg(far, fh, ff, t_far, k_far)
        L_near = pose_leg(near, nh, nf, t_near, k_near)
        legs = Image.new("RGBA", L_far.size, (0, 0, 0, 0))
        legs.alpha_composite(L_far); legs.alpha_composite(L_near)
        lowest = np.where((np.array(legs)[:, :, 3] > 40).any(axis=1))[0].max()
        dy = ground - lowest
        f = Image.new("RGBA", legs.size, (0, 0, 0, 0))
        # legs behind the body, so the cardigan hem covers the hip seam
        f.alpha_composite(legs, (0, dy))
        f.alpha_composite(up(upper), (0, dy))
        out.append(drop_specks(f.resize(img.size, Image.LANCZOS)))
    return out, (a_near, a_far, amp)
