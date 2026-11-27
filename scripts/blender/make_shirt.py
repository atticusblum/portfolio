"""Build the shirt as a flat T-shirt shape with the design on the chest.

  blender --background --python scripts/blender/make_shirt.py -- \
      [--design design.png] [--color R G B] [--width_cm 52] [--out assets/models/shirt.glb]

  --design    the shirt design file (PNG, transparent background works best).
              Placed on the chest. Without it the shirt is blank.
  --color     shirt fabric color 0-1 RGB (default off-white).
  --width_cm  chest width, armpit to armpit (default 52, a men's M; PLACEHOLDER).
  --long      long sleeves (flat lay, sleeves angled down to the wrist).
  --sheen     slightly glossy fabric (dri-fit).

The outline is a hand-placed T-shirt silhouette, extruded to fabric thickness with
soft edges. Hangs flat, front facing -Y in Blender (+Z in glTF). A wall hanger or a
folded version can come later.
"""
import os
import sys

import bpy

sys.path.append(os.path.dirname(__file__))
import common  # noqa: E402

a = common.args()
opt = lambda k, n=1: a[a.index(k) + 1:a.index(k) + 1 + n] if k in a else None  # noqa: E731
design = (opt("--design") or [None])[0]
color = tuple(float(v) for v in (opt("--color", 3) or (0.9, 0.89, 0.86))) + (1.0,)
chest = float((opt("--width_cm") or [52])[0]) / 100
out = (opt("--out") or ["assets/models/shirt.glb"])[0]

common.reset()

# Half outline (right side), in units of chest width, from collar center clockwise.
# x right, z up. Mirrored for the left side.
half = [
    (0.00, 0.62), (0.16, 0.66), (0.26, 0.64),   # collar to shoulder
    (0.62, 0.50), (0.70, 0.30), (0.52, 0.24),   # sleeve top, cuff, underarm
    (0.50, 0.12), (0.50, -0.72),                # side seam to hem
    (0.00, -0.74),                              # hem center
]
if "--long" in a:
    half = [
        (0.00, 0.62), (0.16, 0.66), (0.26, 0.64),   # collar to shoulder
        (0.52, 0.56), (0.66, 0.36), (0.86, -0.24),  # shoulder seam, elbow, wrist (outer)
        (0.92, -0.32), (0.78, -0.36), (0.74, -0.30),  # cuff
        (0.56, 0.12),                               # inner sleeve to underarm
        (0.50, 0.08), (0.50, -0.72),                # side seam to hem
        (0.00, -0.74),                              # hem center
    ]
outline = half + [(-x, z) for x, z in reversed(half[1:-1])]
# Collar dip at the front.
outline[0] = (0.0, 0.56)

# A filled 2D curve handles the concave outline reliably, then becomes a mesh.
curve = bpy.data.curves.new("shirt", "CURVE")
curve.dimensions = "2D"
curve.fill_mode = "BOTH"
curve.extrude = 0.002  # half the fabric thickness
curve.bevel_depth = 0.0015
curve.bevel_resolution = 2
spline = curve.splines.new("POLY")
spline.points.add(len(outline) - 1)
for pt, (x, z) in zip(spline.points, outline):
    pt.co = (x * chest, z * chest, 0, 1)
spline.use_cyclic_u = True
shirt = bpy.data.objects.new("shirt", curve)
bpy.context.scene.collection.objects.link(shirt)
bpy.context.view_layer.objects.active = shirt
shirt.select_set(True)
bpy.ops.object.convert(target="MESH")
shirt = bpy.context.view_layer.objects.active
# The curve was drawn in X/Y; stand it up so the front faces -Y.
shirt.rotation_euler = (1.5708, 0, 0)
bpy.ops.object.transform_apply(rotation=True)
shirt.data.materials.append(common.material("fabric", color=color, roughness=0.62 if "--sheen" in a else 0.95))

if design:
    img = bpy.data.images.load(os.path.abspath(design))
    aspect = img.size[0] / img.size[1]
    dw = chest * 0.6
    dh = dw / aspect
    # Sits just in front of the fabric's front face (fabric is ~4 mm thick, centered).
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -0.0045, chest * 0.24 - dh / 2), rotation=(1.5708, 0, 0))
    decal = bpy.context.object
    decal.name = "design"
    decal.scale = (dw, dh, 1)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    mat = common.material("design", roughness=0.9)
    tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
    tex.image = img
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    mat.node_tree.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
    # Transparent background of the print exports as glTF alpha blend.
    if hasattr(mat, "surface_render_method"):
        mat.surface_render_method = "BLENDED"
    elif hasattr(mat, "blend_method"):
        mat.blend_method = "BLEND"
    decal.data.materials.append(mat)

common.export_glb(out)
