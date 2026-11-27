"""Build the supplements group: four containers with their labels from Atticus's photo.

  blender --background --python scripts/blender/make_supplements.py -- <labels_dir> <out.glb>

labels_dir holds label-0.png ... label-3.png, made by scripts/supplement-labels.mjs
(front half = the real label, sides extended). Sizes come from the photo's
pixel proportions, scaled so the creatine tub is 11 cm across.
Front faces -Y in Blender (+Z in glTF). Not clickable on the site: a background prop.
"""
import math
import os
import sys

import bmesh
import bpy

sys.path.append(os.path.dirname(__file__))
import common  # noqa: E402

labels_dir, out = common.args()[:2]
common.reset()

# (diameter m, body height m, cap height m, cap color, x position m)
items = [
    (0.066, 0.083, 0.024, (0.32, 0.62, 0.2, 1), -0.115),   # D3 + K2
    (0.080, 0.128, 0.020, (0.32, 0.62, 0.2, 1), -0.04),    # fish oil
    (0.058, 0.109, 0.020, (0.32, 0.62, 0.2, 1), 0.031),    # magnesium
    (0.110, 0.175, 0.023, (0.04, 0.04, 0.04, 1), 0.122),   # creatine tub
]


def cylinder(name, radius, height, z0, mat, uv=True, segs=48):
    """Cylinder with UVs that put u=0.5 at the front (-Y) and the seam at the back."""
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    bottom, top = [], []
    for i in range(segs + 1):
        t = i / segs
        ang = -math.pi + t * 2 * math.pi  # -pi..pi, 0 = front
        x, y = math.sin(ang) * radius, -math.cos(ang) * radius
        bottom.append((bm.verts.new((x, y, z0)), t))
        top.append((bm.verts.new((x, y, z0 + height)), t))
    for i in range(segs):
        (b0, t0), (b1, t1) = bottom[i], bottom[i + 1]
        (u0, _), (u1, _) = top[i], top[i + 1]
        f = bm.faces.new((b0, b1, u1, u0))
        for loop, uvv in zip(f.loops, ((t0, 0), (t1, 0), (t1, 1), (t0, 1))):
            loop[uvl].uv = uvv if uv else (0.5, 0.5)
    for ring, flip in ((bottom, True), (top, False)):
        vs = [v for v, _ in ring[:-1]]
        f = bm.faces.new(list(reversed(vs)) if flip else vs)
        for loop in f.loops:
            loop[uvl].uv = (0.5, 0.98)  # caps sample the label's top edge color
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = abs(p.normal.z) < 0.5
    return ob


for i, (dia, body_h, cap_h, cap_col, x) in enumerate(items):
    label = common.material(f"label-{i}", roughness=0.45, image=os.path.join(labels_dir, f"label-{i}.png"))
    body = cylinder(f"bottle-{i}", dia / 2, body_h, 0, label)
    cap = cylinder(f"cap-{i}", dia / 2 * 1.02, cap_h, body_h, common.material(f"cap-{i}", color=cap_col, roughness=0.5), uv=False)
    for o in (body, cap):
        o.location.x = x

common.export_glb(out)
