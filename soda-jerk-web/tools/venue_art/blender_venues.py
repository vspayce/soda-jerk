"""Counter, door and stool art for the soda fountain and circus venues,
modelled and rendered in Blender.

    /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \\
        --python blender_venues.py [-- OUT_DIR] [-- ONLY=name,name]

Writes to public/art (or OUT_DIR):
    counter-fountain.png   marble top, cherry-red enamel front, chrome trim
    counter-circus.png     gold ledge, striped front, scalloped valance, bulbs
    door-fountain-{left,right}.png   chrome-framed glass leaves
    door-circus-{left,right}.png     striped tent flaps
    stool-fountain.png     red vinyl stool on a chrome post

Counters are 8:1 like the lane they span (Lane.jsx draws them at the
counter height across the full lane width). Door leaves share the saloon
door's leaf proportions (410x898) so Lane.jsx lays them out the same way.
Everything is rendered at 2x and averaged down for clean edges.
"""
import math
import os
import sys

import bpy
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ART = os.path.abspath(os.path.join(HERE, "..", "..", "public", "art"))
SS = 2


# ---------------------------------------------------------------- scene

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    engines = {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items}
    sc.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
    sc.render.film_transparent = True
    sc.view_settings.view_transform = "Standard"
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.eevee.taa_render_samples = 32
    world = bpy.data.worlds.new("world")
    sc.world = world
    nt = world.node_tree if world.node_tree else None
    if nt is None:
        world.use_nodes = True
        nt = world.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    # a soft studio gradient: bright overhead, dark below — what chrome
    # needs to read as chrome (light band over a dark band)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.42
    ramp.color_ramp.elements[0].color = (0.02, 0.02, 0.03, 1)
    ramp.color_ramp.elements[1].position = 0.62
    ramp.color_ramp.elements[1].color = (1.0, 0.97, 0.92, 1)
    mp = nt.nodes.new("ShaderNodeMapRange")
    mp.inputs["From Min"].default_value = -1
    mp.inputs["From Max"].default_value = 1
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    nt.links.new(sep.outputs["Z"], mp.inputs["Value"])
    nt.links.new(mp.outputs["Result"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 0.9
    nt.links.new(bg.outputs[0], out.inputs[0])
    return sc


def lights():
    key = bpy.data.objects.new("key", bpy.data.lights.new("key", "AREA"))
    key.data.energy = 900; key.data.size = 12
    key.location = (-3, -8, 9); key.rotation_euler = (math.radians(50), 0, math.radians(-15))
    fill = bpy.data.objects.new("fill", bpy.data.lights.new("fill", "AREA"))
    fill.data.energy = 300; fill.data.size = 14
    fill.location = (5, -9, 2); fill.rotation_euler = (math.radians(80), 0, math.radians(20))
    for o in (key, fill):
        bpy.context.collection.objects.link(o)


def camera(w_units, h_units, px_w, px_h, tilt_deg=0, center=(0, 0, 0)):
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    bpy.context.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = max(w_units, h_units)
    t = math.radians(tilt_deg)
    d = 30
    cam.location = (center[0], center[1] - d * math.cos(t), center[2] + d * math.sin(t))
    cam.rotation_euler = (math.radians(90) - t, 0, 0)
    sc = bpy.context.scene
    sc.camera = cam
    sc.render.resolution_x = px_w * SS
    sc.render.resolution_y = px_h * SS
    return cam


# ---------------------------------------------------------------- materials

def mat(name, color, metallic=0.0, rough=0.5, emission=None, alpha=1.0, coat=0.0):
    m = bpy.data.materials.new(name)
    if hasattr(m, "use_nodes") and not m.use_nodes:
        m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Metallic"].default_value = metallic
    p.inputs["Roughness"].default_value = rough
    if coat and "Coat Weight" in p.inputs:
        p.inputs["Coat Weight"].default_value = coat
    if emission:
        p.inputs["Emission Color"].default_value = (*emission[0], 1)
        p.inputs["Emission Strength"].default_value = emission[1]
    if alpha < 1:
        p.inputs["Alpha"].default_value = alpha
        if hasattr(m, "surface_render_method"):
            m.surface_render_method = "BLENDED"
    return m


def chrome():
    return mat("chrome", (0.92, 0.93, 0.95), metallic=1.0, rough=0.12)


def marble():
    m = mat("marble", (0.94, 0.93, 0.9), rough=0.25, coat=0.6)
    nt = m.node_tree
    p = nt.nodes.get("Principled BSDF")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 1.6
    noise.inputs["Detail"].default_value = 8
    noise.inputs["Distortion"].default_value = 3.5
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.inputs["Scale"].default_value = 0.9
    wave.inputs["Distortion"].default_value = 7
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (0.55, 0.56, 0.6, 1)
    ramp.color_ramp.elements[1].position = 0.12
    ramp.color_ramp.elements[1].color = (0.95, 0.94, 0.91, 1)
    nt.links.new(tc.outputs["Object"], noise.inputs["Vector"])
    nt.links.new(noise.outputs["Color"], wave.inputs["Vector"])
    nt.links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], p.inputs["Base Color"])
    return m


def stripes(name, a, b, width, axis="X", rough=0.6):
    """Vertical bands of colour a/b, `width` units each, along `axis`."""
    m = mat(name, a, rough=rough)
    nt = m.node_tree
    p = nt.nodes.get("Principled BSDF")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    div = nt.nodes.new("ShaderNodeMath"); div.operation = "DIVIDE"; div.inputs[1].default_value = width
    md = nt.nodes.new("ShaderNodeMath"); md.operation = "FLOORED_MODULO"; md.inputs[1].default_value = 2
    gt = nt.nodes.new("ShaderNodeMath"); gt.operation = "GREATER_THAN"; gt.inputs[1].default_value = 1
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"
    mix.inputs[6].default_value = (*a, 1); mix.inputs[7].default_value = (*b, 1)
    nt.links.new(tc.outputs["Object"], sep.inputs[0])
    nt.links.new(sep.outputs[axis], div.inputs[0])
    nt.links.new(div.outputs[0], md.inputs[0])
    nt.links.new(md.outputs[0], gt.inputs[0])
    nt.links.new(gt.outputs[0], mix.inputs[0])
    nt.links.new(mix.outputs[2], p.inputs["Base Color"])
    return m


# ---------------------------------------------------------------- geometry

def box(name, size, loc, material, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        mod = ob.modifiers.new("bevel", "BEVEL"); mod.width = bevel; mod.segments = 4
    ob.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return ob


def rod(name, length, radius, loc, material, axis="X"):
    rot = {"X": (0, math.radians(90), 0), "Y": (math.radians(90), 0, 0), "Z": (0, 0, 0)}[axis]
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius, depth=length, location=loc, rotation=rot)
    ob = bpy.context.active_object
    ob.name = name
    ob.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return ob


def ball(name, radius, loc, material):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=loc, segments=24, ring_count=12)
    ob = bpy.context.active_object
    ob.name = name
    ob.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return ob


def half_disc(name, x, y, z, r, material, n=24):
    """A flat half-disc hanging down from (x, z), facing the camera."""
    verts = [(x, y, z)] + [(x + r * math.cos(math.pi + math.pi * i / n), y, z + r * math.sin(math.pi + math.pi * i / n))
                           for i in range(n + 1)]
    faces = [(0, i + 1, i + 2) for i in range(n)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(material)
    return ob


# ---------------------------------------------------------------- pieces
# Counters: 16 units wide x 2 tall (8:1), front face on the -Y side,
# top at z=1. The camera tilts down a little so the top shows as a band.

def counter_fountain():
    cr = chrome()
    red = mat("enamel", (0.62, 0.03, 0.05), rough=0.18, coat=1.0)
    black = mat("kick", (0.03, 0.03, 0.035), rough=0.4)
    box("body", (15.6, 1.2, 1.55), (0, 0.3, -0.12), red, bevel=0.04)
    box("top", (16.0, 1.6, 0.2), (0, 0.15, 0.78), marble(), bevel=0.06)
    rod("lip", 16.0, 0.07, (0, -0.65, 0.7), cr)
    for z in (0.32, -0.02, -0.36):
        rod(f"rib{z}", 15.62, 0.035, (0, -0.31, z), cr)
    box("kick", (15.62, 1.22, 0.2), (0, 0.3, -0.84), black)
    rod("kickrail", 15.62, 0.03, (0, -0.31, -0.72), cr)
    for x in (-7.8, 7.8):
        box(f"cap{x}", (0.35, 1.3, 1.6), (x, 0.3, -0.12), cr, bevel=0.08)
    # chrome pilasters split the front into four panels, like the wood
    # counter's, and a turquoise band runs under the lip
    for x in (-3.9, 0.0, 3.9):
        box(f"pilaster{x}", (0.22, 0.1, 1.5), (x, -0.32, -0.12), cr, bevel=0.05)
    teal = mat("teal", (0.1, 0.55, 0.55), rough=0.25, coat=0.8)
    box("band", (15.62, 0.06, 0.12), (0, -0.33, 0.52), teal)


def counter_circus():
    gold = mat("gold", (0.95, 0.68, 0.18), metallic=0.85, rough=0.3)
    ledge = mat("ledge", (0.93, 0.66, 0.12), rough=0.35, coat=0.5)
    front = stripes("canvas", (0.72, 0.06, 0.07), (0.96, 0.9, 0.78), 0.55)
    navy = mat("valance", (0.08, 0.12, 0.38), rough=0.5)
    bulb = mat("bulb", (1, 0.85, 0.4), emission=((1.0, 0.7, 0.25), 1.6))
    box("body", (15.6, 1.2, 1.7), (0, 0.3, -0.1), front, bevel=0.03)
    box("top", (16.0, 1.6, 0.22), (0, 0.15, 0.82), ledge, bevel=0.08)
    rod("lip", 16.0, 0.08, (0, -0.66, 0.73), gold)
    # scalloped valance hanging under the ledge, with gold piping
    n = 16
    for i in range(n):
        x = -7.5 + i * 15 / (n - 1)
        half_disc(f"scallop{i}", x, -0.33, 0.52, 0.5, navy)
        ball(f"bulb{i}", 0.085, (x, -0.42, 0.06), bulb)
    rod("piping", 15.6, 0.04, (0, -0.36, 0.53), gold)
    box("kick", (15.62, 1.22, 0.18), (0, 0.3, -0.86), gold, bevel=0.03)
    for x in (-7.8, 7.8):
        rod(f"post{x}", 1.9, 0.22, (x, -0.2, -0.05), gold, axis="Z")
        ball(f"knob{x}", 0.27, (x, -0.2, 1.02), gold)


def door_fountain():
    """One leaf, hinged on its left edge: chrome frame round a glass pane,
    a push bar, a kick plate. 4.1 x 8.98 units, like the saloon leaf."""
    cr = chrome()
    glass = mat("glass", (0.62, 0.85, 0.9), rough=0.05, alpha=0.42)
    w, h = 3.9, 8.8
    box("pane", (w - 0.5, 0.05, h - 0.9), (0, 0, 0.2), glass)
    box("frameL", (0.28, 0.25, h), (-w / 2 + 0.14, 0, 0), cr, bevel=0.06)
    box("frameR", (0.28, 0.25, h), (w / 2 - 0.14, 0, 0), cr, bevel=0.06)
    box("frameT", (w, 0.25, 0.3), (0, 0, h / 2 - 0.15), cr, bevel=0.06)
    box("kick", (w, 0.25, 1.1), (0, 0, -h / 2 + 0.55), cr, bevel=0.06)
    rod("bar", w - 0.7, 0.09, (0, -0.32, -0.1), cr)
    for x in (-w / 2 + 0.55, w / 2 - 0.55):
        rod(f"stand{x}", 0.3, 0.05, (x, -0.18, -0.1), cr, axis="Y")


def door_circus():
    """One tent flap: striped canvas, draped a little, with a gold tassel."""
    canvas = stripes("flap", (0.72, 0.06, 0.07), (0.96, 0.9, 0.78), 0.65)
    gold = mat("gold", (0.95, 0.68, 0.18), metallic=0.85, rough=0.3)
    w, h = 3.9, 8.8
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=24, y_subdivisions=48, size=1, location=(0, 0, 0),
                                    rotation=(math.radians(90), 0, 0))
    flap = bpy.context.active_object
    flap.scale = (w, h, 1)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    for v in flap.data.vertices:
        x, z = v.co.x, v.co.z
        s = (x + w / 2) / w           # 0 at the hinge, 1 at the free edge
        t = (h / 2 - z) / h           # 0 at the top, 1 at the bottom
        # gathered toward the tie-back at the free edge, billowing out below
        v.co.y = -0.35 * math.sin(math.pi * s) * (0.4 + t) + 0.08 * math.sin(x * 6)
        v.co.x = x - 0.5 * s * math.sin(math.pi * min(1, t * 1.6)) * (1 - t) * 0.6
    sol = flap.modifiers.new("thick", "SOLIDIFY"); sol.thickness = 0.06
    flap.data.materials.append(canvas)
    bpy.ops.object.shade_smooth()
    box("valance", (w, 0.3, 0.45), (0, -0.1, h / 2 - 0.2), gold, bevel=0.08)
    rod("cord", 0.9, 0.05, (w / 2 - 0.45, -0.45, 0.4), gold, axis="Z")
    ball("tassel", 0.18, (w / 2 - 0.45, -0.45, -0.1), gold)


def stool_fountain():
    cr = chrome()
    vinyl = mat("vinyl", (0.66, 0.04, 0.06), rough=0.3, coat=0.8)
    rod("seat", 0.35, 0.95, (0, 0, 1.6), vinyl, axis="Z")
    rod("band", 0.12, 0.98, (0, 0, 1.38), cr, axis="Z")
    rod("post", 2.4, 0.12, (0, 0, 0.2), cr, axis="Z")
    rod("ring", 0.06, 0.55, (0, 0, -0.1), cr, axis="Z")
    rod("base", 0.12, 0.6, (0, 0, -1.0), cr, axis="Z")


# ---------------------------------------------------------------- output

def render(path, px_w, px_h):
    sc = bpy.context.scene
    tmp = path + ".tmp.png"
    sc.render.filepath = tmp
    bpy.ops.render.render(write_still=True)
    im = bpy.data.images.load(tmp)
    a = np.array(im.pixels[:], dtype=np.float32).reshape(px_h * SS, px_w * SS, 4)
    bpy.data.images.remove(im)
    os.remove(tmp)
    pm = a.copy(); pm[..., :3] *= pm[..., 3:4]
    pm = pm.reshape(px_h, SS, px_w, SS, 4).mean(axis=(1, 3))
    al = pm[..., 3:4]
    rgb = np.where(al > 1e-6, pm[..., :3] / np.maximum(al, 1e-6), 0)
    out = np.concatenate([rgb, al], axis=2)
    save(out, path)
    return out


def save(arr, path):
    h, w = arr.shape[:2]
    im = bpy.data.images.new("out", w, h, alpha=True)
    im.pixels[:] = np.clip(arr, 0, 1).astype(np.float32).ravel()
    im.filepath_raw = path; im.file_format = "PNG"
    im.save()
    bpy.data.images.remove(im)


def mirror_png(src, dst):
    im = bpy.data.images.load(src)
    w, h = im.size
    a = np.array(im.pixels[:], dtype=np.float32).reshape(h, w, 4)[:, ::-1]
    bpy.data.images.remove(im)
    save(a, dst)


PIECES = {
    # name: (build, frame w units, h units, px w, px h, camera tilt, centre)
    "counter-fountain": (counter_fountain, 16.4, 2.05, 1600, 200, 14, (0, 0, 0)),
    "counter-circus": (counter_circus, 16.4, 2.05, 1600, 200, 14, (0, 0, 0)),
    "door-fountain-left": (door_fountain, 4.1, 8.98, 410, 898, 0, (0, 0, 0)),
    "door-circus-left": (door_circus, 4.1, 8.98, 410, 898, 0, (0, 0, 0)),
    "stool-fountain": (stool_fountain, 2.2, 3.3, 220, 330, 8, (0, 0, 0.35)),
}


def main():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    only = None
    out_dir = ART
    for a in args:
        if a.startswith("ONLY="):
            only = set(a[5:].split(","))
        else:
            out_dir = os.path.abspath(a)
    os.makedirs(out_dir, exist_ok=True)
    for name, (build, wu, hu, pw, ph, tilt, centre) in PIECES.items():
        if only and name not in only:
            continue
        reset()
        lights()
        build()
        camera(wu, hu, pw, ph, tilt, centre)
        path = os.path.join(out_dir, name + ".png")
        render(path, pw, ph)
        if name.endswith("-left"):
            mirror_png(path, path.replace("-left", "-right"))
        print("wrote", path)


main()
