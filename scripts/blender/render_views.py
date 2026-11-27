"""Render front, side, and top views of a .glb for review.

  blender --background --python scripts/blender/render_views.py -- <model.glb> <out_dir> <prefix>

Writes <out_dir>/<prefix>-front.png, -side.png, -top.png (orthographic, neutral light,
plain background). Uses glTF axes: front = +Z (Blender -Y), up = +Y (Blender +Z).
"""
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.append(os.path.dirname(__file__))
import common  # noqa: E402

src, out_dir, prefix = common.args()[:3]
common.reset()
bpy.ops.import_scene.gltf(filepath=os.path.abspath(src))

obs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
pts = [o.matrix_world @ Vector(c) for o in obs for c in o.bound_box]
lo = Vector([min(p[i] for p in pts) for i in range(3)])
hi = Vector([max(p[i] for p in pts) for i in range(3)])
center = (lo + hi) / 2
span = max(hi - lo) * 1.35

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items] else "BLENDER_EEVEE"
scene.render.resolution_x = scene.render.resolution_y = 900
scene.render.film_transparent = False
world = bpy.data.worlds.new("w")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.92, 0.91, 0.88, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
scene.world = world

key = bpy.data.objects.new("key", bpy.data.lights.new("key", "SUN"))
key.data.energy = 3.0
key.rotation_euler = (math.radians(50), 0, math.radians(-35))
scene.collection.objects.link(key)

cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.data.type = "ORTHO"
cam.data.ortho_scale = span
scene.collection.objects.link(cam)
scene.camera = cam

# Blender axes: front looks from -Y, side from +X, top from +Z.
views = {
    "front": ((0, -1, 0), (math.radians(90), 0, 0)),
    "side": ((1, 0, 0), (math.radians(90), 0, math.radians(90))),
    "top": ((0, 0, 1), (0, 0, 0)),
}
os.makedirs(out_dir, exist_ok=True)
for name, (d, rot) in views.items():
    cam.location = center + Vector(d) * span * 3
    cam.rotation_euler = rot
    scene.render.filepath = os.path.join(os.path.abspath(out_dir), f"{prefix}-{name}.png")
    bpy.ops.render.render(write_still=True)
    print("wrote", scene.render.filepath)
