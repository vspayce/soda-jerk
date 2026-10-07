"""The jerk's run cycle, rigged and rendered in Blender.

    /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \\
        --python blender_jerk_run.py [-- OUT_DIR]

Same picture, same cut-up and same run cycle as jerk_run.py, but each part
is a mesh skinned to bones instead of a cut-out rotated as a block. So a
leg bends smoothly through the knee instead of being two pieces with a
seam (and a drawn knee cap) between them; the arms swing from a soft
shoulder; and the whole figure leans and bobs a little with the stride.
Rendered at 3x with crisp texels, then averaged down, so turned edges stay
clean instead of going jagged.

Writes public/art/player-run-cycle.png (8 frames, facing right, same frame
size as before), or a debug sheet in OUT_DIR if one's given.
"""
import math
import os
import sys

import bpy
import numpy as np
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ART = os.path.join(HERE, "..", "..", "public", "art")
SOURCE = os.path.join(HERE, "jerk-run-src.png")

N = 8
SS = 3          # render scale; averaged back down at the end
PAD = (10, 4)
GRID = 2        # mesh vertex spacing, in picture pixels
KNEE_BLEND = 3  # half-width (px) of the soft bend across the knee — any
# wider and the crease ink behind a bent knee tears into strands as it opens
SHOULDER_BLEND = 9
CREASE_R = 22  # px round the knee whose crease ink is unfolded
SAMPLING = "Linear"  # smoother turned edges than "Closest"

# --- landmarks: the same measurements as jerk_run.py (mirrored, cropped
# figure coords; the picture faces right and is rigged facing left) -------
HEM = 185
APRON = [(58, 184), (138, 176), (142, 206), (128, 226), (102, 234), (78, 230), (60, 212)]
SEAM = [(118, 185), (118, 245), (150, 282), (162, 350)]
LEGS = {
    "near": ((95, 192), (48, 219), (106, 286)),
    "far": ((132, 192), (168, 258), (205, 318)),
}
THIGH_W = 27
ARMS = [
    ((0, 84, 68, 154), (68, 118), 55),
    ((158, 86, 229, 178), (160, 100), -55),
]
WHITE = (250, 250, 250, 255)
SHADE = (196, 196, 204, 255)
INK = (18, 16, 20, 255)


# ---------------------------------------------------------------- picture

def load_picture():
    im = bpy.data.images.load(SOURCE)
    w, h = im.size
    a = np.array(im.pixels[:], dtype=np.float32).reshape(h, w, 4)[::-1]
    a = np.round(a * 255).astype(np.uint8)
    ys, xs = np.where(a[:, :, 3] > 0)
    fig = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1][:, ::-1]
    H, W = fig.shape[0] + 2 * PAD[1], fig.shape[1] + 2 * PAD[0]
    canvas = np.zeros((H, W, 4), np.uint8)
    canvas[PAD[1]:PAD[1] + fig.shape[0], PAD[0]:PAD[0] + fig.shape[1]] = fig
    return canvas


def P(pt):
    return (pt[0] + PAD[0], pt[1] + PAD[1])


def poly_mask(shape, pts):
    """Filled polygon (even-odd), in canvas pixels, from figure coords."""
    H, W = shape
    Y, X = np.mgrid[0:H, 0:W]
    X = X + 0.5; Y = Y + 0.5
    pts = [P(p) for p in pts]
    inside = np.zeros((H, W), bool)
    for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1]):
        cross = ((y0 > Y) != (y1 > Y)) & (X < (x1 - x0) * (Y - y0) / ((y1 - y0) or 1e-9) + x0)
        inside ^= cross
    return inside


def seam_x(y):
    for (x0, y0), (x1, y1) in zip(SEAM, SEAM[1:]):
        if y0 <= y <= y1:
            return x0 + (y - y0) * (x1 - x0) / (y1 - y0)
    return SEAM[-1][0]


def layers(a):
    H, W = a.shape[:2]
    op = a[:, :, 3] > 40
    Y, X = np.mgrid[0:H, 0:W]
    fy, fx = Y - PAD[1], X - PAD[0]
    legs = op & (fy >= HEM) & ~poly_mask((H, W), APRON)
    sx = np.array([seam_x(y - PAD[1]) for y in range(H)])[:, None]
    near = legs & (fx < sx)
    far = legs & (fx >= sx)
    body = op & ~near & ~far
    arms = []
    for (x0, y0, x1, y1), pivot, swing in ARMS:
        m = body & (fx >= x0) & (fx < x1) & (fy >= y0) & (fy <= y1)
        arms.append(m)
        body &= ~m

    def lay(m):
        out = np.zeros_like(a); out[m] = a[m]; return out
    near, far = lay(near), lay(far)
    for leg, arr in (("near", near), ("far", far)):
        unfold_crease(arr, *LEGS[leg])
    # The apron hides the near thigh; the scraps of it that show under the
    # apron's edge would swing out loose, so that thigh is the drawn tube
    # (see capsule) and only the shin is kept from the picture.
    near[thigh_side(near.shape[:2], *LEGS["near"]) > 2] = 0
    return {"body": lay(body), "near": near, "far": far,
            "arm0": lay(arms[0]), "arm1": lay(arms[1])}


def thigh_side(shape, hip, knee, ankle):
    """Signed distance across the knee's bisector: > 0 on the thigh's side."""
    H, W = shape
    Y, X = np.mgrid[0:H, 0:W] + 0.5
    k = np.array(P(knee), float)
    u1 = np.array(P(hip), float) - k; u1 /= np.linalg.norm(u1)
    u2 = np.array(P(ankle), float) - k; u2 /= np.linalg.norm(u2)
    n = (u1 - u2) / np.linalg.norm(u1 - u2)
    return (X - k[0]) * n[0] + (Y - k[1]) * n[1]


def unfold_crease(arr, hip, knee, ankle, r=CREASE_R):
    """The ink line in the crook of a bent knee: opening the knee stretches
    it into loose shards, so in the inner corner (between thigh and shin,
    near the joint) it's repainted as plain trouser white."""
    H, W = arr.shape[:2]
    Y, X = np.mgrid[0:H, 0:W] + 0.5
    k = np.array(P(knee), float)
    u1 = np.array(P(hip), float) - k; u1 /= np.linalg.norm(u1)
    u2 = np.array(P(ankle), float) - k; u2 /= np.linalg.norm(u2)
    dx, dy = X - k[0], Y - k[1]
    inner = (np.hypot(dx, dy) < r) & (dx * u1[0] + dy * u1[1] > 0) & (dx * u2[0] + dy * u2[1] > 0)
    dark = arr[:, :, :3].max(axis=2) < 140
    arr[inner & dark & (arr[:, :, 3] > 40)] = WHITE


def capsule(shape, a, b, w):
    """The near thigh, which the apron hides in the picture: a plain
    trouser tube from hip to knee (canvas coords) with the picture's ink
    outline and a band of shade underneath. Returned as (outline, fill) so
    the shin can sit between them."""
    H, W = shape
    Y, X = np.mgrid[0:H, 0:W] + 0.5
    ax, ay = a; bx, by = b
    vx, vy = bx - ax, by - ay
    L2 = vx * vx + vy * vy
    t = np.clip(((X - ax) * vx + (Y - ay) * vy) / L2, 0, 1)
    d = np.hypot(X - (ax + t * vx), Y - (ay + t * vy))
    r = w / 2
    ink = np.zeros((H, W, 4), np.uint8); ink[d <= r + 2] = INK
    fill = np.zeros((H, W, 4), np.uint8); fill[d <= r] = WHITE
    L = math.sqrt(L2); nx, ny = -vy / L, vx / L
    if ny < 0:
        nx, ny = -nx, -ny
    side = (X - ax) * nx + (Y - ay) * ny
    fill[(d <= r) & (side > r * 0.4) & (side < r * 0.85)] = SHADE
    return ink, fill


# ---------------------------------------------------------------- blender

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items} else "BLENDER_EEVEE"
    sc.render.film_transparent = True
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.eevee.taa_render_samples = 64
    sc.render.filter_size = 0.5
    return sc


def to_image(name, arr):
    H, W = arr.shape[:2]
    im = bpy.data.images.new(name, W, H, alpha=True)
    im.colorspace_settings.name = "sRGB"
    im.pixels[:] = (arr[::-1].astype(np.float32) / 255).ravel()
    im.pack()
    return im


def material(name, image):
    m = bpy.data.materials.new(name)
    if hasattr(m, 'use_nodes') and not m.use_nodes:
        m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = image
    tex.interpolation = SAMPLING; tex.extension = "CLIP"
    em = nt.nodes.new("ShaderNodeEmission")
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(tex.outputs["Color"], em.inputs["Color"])
    nt.links.new(tex.outputs["Alpha"], mix.inputs["Fac"])
    nt.links.new(tr.outputs[0], mix.inputs[1])
    nt.links.new(em.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    if hasattr(m, "surface_render_method"):
        m.surface_render_method = "DITHERED"
    else:
        m.blend_method = "HASHED"
    return m


def W3(pt, H):
    """canvas pixel (x right, y down) -> blender (x right, y up), 1 unit = 1px."""
    return Vector((pt[0], H - pt[1], 0.0))


def part_mesh(name, arr, z, H, W, grid=GRID):
    """A grid over the part's opaque pixels, UV-mapped onto its own layer
    image. Faces with nothing opaque nearby are dropped."""
    op = arr[:, :, 3] > 0
    ys, xs = np.where(op)
    x0, x1 = max(0, xs.min() - 4), min(W, xs.max() + 5)
    y0, y1 = max(0, ys.min() - 4), min(H, ys.max() + 5)
    gx = np.arange(x0, x1 + grid, grid); gy = np.arange(y0, y1 + grid, grid)
    verts, idx = [], {}
    for j, y in enumerate(gy):
        for i, x in enumerate(gx):
            idx[i, j] = len(verts); verts.append((x, H - y, z))
    faces = []
    for j in range(len(gy) - 1):
        for i in range(len(gx) - 1):
            cx0, cx1 = int(gx[i]) - 2, int(gx[i + 1]) + 2
            cy0, cy1 = int(gy[j]) - 2, int(gy[j + 1]) + 2
            if op[max(0, cy0):max(0, cy1), max(0, cx0):max(0, cx1)].any():
                faces.append((idx[i, j + 1], idx[i + 1, j + 1], idx[i + 1, j], idx[i, j]))
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    uv = me.uv_layers.new()
    for loop in me.loops:
        v = me.vertices[loop.vertex_index].co
        uv.data[loop.index].uv = (v.x / W, v.y / H)
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(material(name, to_image(name, arr)))
    # which vertices sit on ink — used to find the feet for ground contact
    pad = np.pad(op, 2)
    ob["opaque"] = [bool(pad[int(min(max(H - v.co.y, 0), H - 1)):int(min(max(H - v.co.y, 0), H - 1)) + 5,
                             int(min(max(v.co.x, 0), W - 1)):int(min(max(v.co.x, 0), W - 1)) + 5].any())
                    for v in me.vertices]
    return ob


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def build(canvas):
    H, W = canvas.shape[:2]
    L = layers(canvas)
    near_hip, near_knee, _ = (P(p) for p in LEGS["near"])
    ink, fill = capsule((H, W), near_hip, near_knee, THIGH_W)

    # back to front
    obs = {
        "far": part_mesh("far", L["far"], 0, H, W),
        "near_ink": part_mesh("near_ink", ink, 1, H, W, grid=3),
        "near": part_mesh("near", L["near"], 2, H, W),
        "near_fill": part_mesh("near_fill", fill, 3, H, W, grid=3),
        "body": part_mesh("body", L["body"], 4, H, W, grid=3),
        "arm0": part_mesh("arm0", L["arm0"], 5, H, W),
        "arm1": part_mesh("arm1", L["arm1"], 6, H, W),
    }

    arm = bpy.data.armatures.new("rig")
    rig = bpy.data.objects.new("rig", arm)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm.edit_bones

    def bone(name, head, tail, parent=None):
        b = eb.new(name)
        b.head = W3(head, H); b.tail = W3(tail, H)
        if parent:
            b.parent = eb[parent]
        return b

    hips = ((near_hip[0] + P(LEGS["far"][0])[0]) / 2, near_hip[1])
    bone("body", hips, (hips[0], hips[1] - 120))
    for leg, (h, k, a) in LEGS.items():
        bone(f"{leg}_thigh", P(h), P(k), "body")
        bone(f"{leg}_shin", P(k), P(a), f"{leg}_thigh")
    for i, (box, pivot, swing) in enumerate(ARMS):
        cx = (box[0] + box[2]) / 2; cy = (box[1] + box[3]) / 2
        bone(f"arm{i}", P(pivot), P((cx, cy)), "body")
    bpy.ops.object.mode_set(mode="OBJECT")

    def skin(ob, weights):
        for gname, w in weights.items():
            vg = ob.vertex_groups.new(name=gname)
            for vi, wv in enumerate(w):
                if wv > 1e-4:
                    vg.add([vi], float(wv), "REPLACE")
        mod = ob.modifiers.new("rig", "ARMATURE"); mod.object = rig
        ob.parent = rig

    def coords(ob):
        c = np.array([v.co[:] for v in ob.data.vertices])
        return c[:, 0], H - c[:, 1]  # canvas x, y

    for leg in ("near", "far"):
        h, k, a = (np.array(P(p), float) for p in LEGS[leg])
        u1 = (h - k) / np.linalg.norm(h - k); u2 = (a - k) / np.linalg.norm(a - k)
        n = (u1 - u2) / np.linalg.norm(u1 - u2)
        x, y = coords(obs[leg])
        side = (x - k[0]) * n[0] + (y - k[1]) * n[1]
        wt = smoothstep(-KNEE_BLEND, KNEE_BLEND, side)
        if leg == "near":
            wt[:] = 0  # just the shin's left of this leg (see layers)
        skin(obs[leg], {f"{leg}_thigh": wt, f"{leg}_shin": 1 - wt})
    for name in ("near_ink", "near_fill"):
        skin(obs[name], {"near_thigh": np.ones(len(obs[name].data.vertices))})
    skin(obs["body"], {"body": np.ones(len(obs["body"].data.vertices))})
    for i, (box, pivot, swing) in enumerate(ARMS):
        x, y = coords(obs[f"arm{i}"])
        p = np.array(P(pivot), float)
        d = np.hypot(x - p[0], y - p[1])
        wa = smoothstep(0, SHOULDER_BLEND * 2, d)
        skin(obs[f"arm{i}"], {f"arm{i}": wa, "body": 1 - wa})
    return rig, obs, (H, W)


def fwd_angle(a, b):
    return math.degrees(math.atan2(a[0] - b[0], b[1] - a[1]))


def cycle(phi):
    thigh = 12 + 46 * math.cos(phi)
    knee = 14 + 100 * max(0.0, math.cos(phi - 7 * math.pi / 4)) ** 1.3
    return thigh, knee


def rot_about(deg_ccw, pivot):
    return Matrix.Translation(pivot) @ Matrix.Rotation(math.radians(deg_ccw), 4, "Z") @ Matrix.Translation(-pivot)


def pose(rig, phi, H):
    """Pose for phase phi, as world-space rotations about each joint.
    On screen (y up, figure facing left) 'forward' for a leg is clockwise."""
    pb = rig.pose.bones
    # the torso: a slight forward lean that deepens as the legs scissor
    # out, and a rock with each stride
    hips = pb["body"].bone.head_local.copy()
    lean = 4 + 2.5 * math.cos(2 * phi)
    B = rot_about(lean, hips)
    pb["body"].matrix = B @ pb["body"].bone.matrix_local
    bpy.context.view_layer.update()
    for leg, off in (("near", 0.0), ("far", math.pi)):
        h, k, a = (P(p) for p in LEGS[leg])
        t_thigh, t_knee = cycle(phi + off)
        d_thigh = t_thigh - fwd_angle(h, k)
        d_shin = (t_thigh - t_knee) - fwd_angle(k, a)
        hip = W3(h, H); knee = W3(k, H)
        # the hip rides on the torso, the leg itself keeps to the cycle
        hip_now = B @ hip
        T = Matrix.Translation(hip_now - hip) @ rot_about(-d_thigh, hip)
        pb[f"{leg}_thigh"].matrix = T @ pb[f"{leg}_thigh"].bone.matrix_local
        bpy.context.view_layer.update()
        knee_now = T @ knee
        S = Matrix.Translation(knee_now - knee) @ rot_about(-d_shin, knee)
        pb[f"{leg}_shin"].matrix = S @ pb[f"{leg}_shin"].bone.matrix_local
        bpy.context.view_layer.update()
    for i, (box, pivot, swing) in enumerate(ARMS):
        a = swing * (1 - math.cos(phi)) / 2
        p = W3(P(pivot), H)
        M = Matrix.Translation(B @ p - p) @ rot_about(a + lean, p)
        pb[f"arm{i}"].matrix = M @ pb[f"arm{i}"].bone.matrix_local
        bpy.context.view_layer.update()


def lowest_foot(obs):
    dg = bpy.context.evaluated_depsgraph_get()
    low = None
    for name in ("near", "far"):
        ob = obs[name]
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
        mw = ob.matrix_world
        mask = ob["opaque"]
        for v, keep in zip(me.vertices, mask):
            if keep:
                y = (mw @ v.co).y
                low = y if low is None else min(low, y)
        ev.to_mesh_clear()
    return low


def camera(sc, H, W):
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    bpy.context.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = max(W, H)
    cam.data.sensor_fit = "AUTO"
    cam.location = (W / 2, H / 2, 50)
    sc.camera = cam
    sc.render.resolution_x = W * SS
    sc.render.resolution_y = H * SS
    sc.render.resolution_percentage = 100


def render_frame(sc, path, H, W):
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    im = bpy.data.images.load(path)
    a = np.array(im.pixels[:], dtype=np.float32).reshape(H * SS, W * SS, 4)[::-1]
    bpy.data.images.remove(im)
    # average 3x3 blocks, premultiplied so edges don't go dark
    pm = a.copy(); pm[..., :3] *= pm[..., 3:4]
    pm = pm.reshape(H, SS, W, SS, 4).mean(axis=(1, 3))
    al = pm[..., 3:4]
    rgb = np.where(al > 1e-6, pm[..., :3] / np.maximum(al, 1e-6), 0)
    out = np.concatenate([rgb, al], axis=2)
    out = np.round(np.clip(out, 0, 1) * 255).astype(np.uint8)
    out[out[:, :, 3] <= 40] = 0  # the faint fringe a downscale leaves
    return drop_specks(out)[:, ::-1]  # face right again


def drop_specks(arr, min_px=60):
    """Clear any small island of ink cut off from the figure (the figure
    itself is one connected shape)."""
    A = arr[:, :, 3] > 40
    H, W = A.shape
    seen = np.zeros_like(A)
    for y0, x0 in zip(*np.nonzero(A)):
        if seen[y0, x0]:
            continue
        stack = [(y0, x0)]; seen[y0, x0] = True; pts = []
        while stack:
            y, x = stack.pop(); pts.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < H and 0 <= nx < W and A[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True; stack.append((ny, nx))
        if len(pts) < min_px:
            ys, xs = zip(*pts)
            arr[list(ys), list(xs)] = 0
    return arr


def save_png(arr, path):
    H, W = arr.shape[:2]
    im = bpy.data.images.new("out", W, H, alpha=True)
    im.pixels[:] = (arr[::-1].astype(np.float32) / 255).ravel()
    im.filepath_raw = path; im.file_format = "PNG"
    im.save()
    bpy.data.images.remove(im)


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    out_dir = argv[0] if argv else None
    canvas = load_picture()
    sc = reset()
    rig, obs, (H, W) = build(canvas)
    camera(sc, H, W)
    only = os.environ.get("ONLY")  # debug: render just these parts
    if only:
        for name, ob in obs.items():
            ob.hide_render = name not in only.split(",")
    tmp = os.path.join(out_dir or bpy.app.tempdir, "_frame.png")
    ground = PAD[1]  # lowest ink sits this far above the bottom edge
    frames = []
    for i in range(N):
        phi = i / N * 2 * math.pi
        rig.location = (0, 0, 0)
        pose(rig, phi, H)
        rig.location = (0, ground - lowest_foot(obs), 0)
        bpy.context.view_layer.update()
        frames.append(render_frame(sc, tmp, H, W))
        print(f"frame {i + 1}/{N}")
    sheet = np.concatenate(frames, axis=1)
    if out_dir:
        bg = np.zeros_like(sheet); bg[...] = (200, 190, 170, 255)
        a = sheet[..., 3:4] / 255.0
        bg[..., :3] = (sheet[..., :3] * a + bg[..., :3] * (1 - a)).astype(np.uint8)
        save_png(bg, os.path.join(out_dir, "jerk-run-blender.png"))
        save_png(sheet, os.path.join(out_dir, "player-run-cycle.png"))
    else:
        save_png(sheet, os.path.abspath(os.path.join(ART, "player-run-cycle.png")))
    print("frame size", W, "x", H, "sheet", sheet.shape[1], "x", sheet.shape[0])


main()
