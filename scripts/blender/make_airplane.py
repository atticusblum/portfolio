"""Build the toy airplane (no photo yet, so a generic toy prop plane).

  blender --background --python scripts/blender/make_airplane.py -- [--out assets/models/toy-airplane.glb]

Pine green fuselage, paper-colored wings and tail, dark propeller. The propeller
is its own node named "propeller" so the site can spin it. Nose points -Y in
Blender (+Z in glTF). The LinkedIn banner is drawn by the site, not baked in.
"""
import math
import os
import sys

import bpy

sys.path.append(os.path.dirname(__file__))
import common  # noqa: E402

a = common.args()
out = a[a.index("--out") + 1] if "--out" in a else "assets/models/toy-airplane.glb"
common.reset()

green = common.material("fuselage", color=(0.03, 0.1, 0.06, 1), roughness=0.45)  # Pine #2F5D46 in linear
paper = common.material("wings", color=(0.84, 0.83, 0.78, 1), roughness=0.6)
dark = common.material("prop", color=(0.05, 0.05, 0.05, 1), roughness=0.5)

# Fuselage: a stretched sphere along Y.
bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.05)
body = bpy.context.object
body.name = "fuselage"
body.scale = (0.75, 2.6, 0.75)
bpy.ops.object.transform_apply(scale=True)
body.data.materials.append(green)
for p in body.data.polygons:
    p.use_smooth = True

common.box("wing", (0.34, 0.06, 0.008), location=(0, -0.02, -0.005), mat=paper, bevel=0.004)
common.box("stabilizer", (0.13, 0.035, 0.006), location=(0, 0.115, 0.004), mat=paper, bevel=0.003)
common.box("fin", (0.006, 0.04, 0.05), location=(0, 0.12, 0.03), mat=paper, bevel=0.002)

# Propeller: hub plus two blades, parented under one node for spinning.
prop = bpy.data.objects.new("propeller", None)
bpy.context.scene.collection.objects.link(prop)
prop.location = (0, -0.135, 0)
bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.012, depth=0.014, rotation=(math.pi / 2, 0, 0), location=(0, -0.135, 0))
hub = bpy.context.object
hub.data.materials.append(dark)
blade = common.box("blade", (0.11, 0.004, 0.014), location=(0, -0.138, 0), mat=dark, bevel=0.002)
for o in (hub, blade):
    mw = o.matrix_world.copy()
    o.parent = prop
    o.matrix_world = mw

common.export_glb(out)
