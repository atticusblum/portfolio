"""Build the Mac as an open laptop.

  blender --background --python scripts/blender/make_laptop.py -- [--out assets/models/mac.glb] [--angle 110]

Proportions of a 14-inch MacBook Pro (31.3 x 22.1 cm footprint). Aluminum body,
dark keyboard well, trackpad, black bezel. The screen is its own material named
"screen" so the site can put the home screen on it later (Phase 5).
Front edge faces -Y in Blender (+Z in glTF); the lid hinges at the back.
"""
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.append(os.path.dirname(__file__))
import common  # noqa: E402

a = common.args()
out = a[a.index("--out") + 1] if "--out" in a else "assets/models/mac.glb"
angle = float(a[a.index("--angle") + 1]) if "--angle" in a else 110.0

common.reset()
W, D = 0.313, 0.221
base_t, lid_t = 0.009, 0.006
alu = common.material("aluminum", color=(0.72, 0.73, 0.74, 1), roughness=0.32, metallic=0.85)
dark = common.material("keyboard", color=(0.06, 0.06, 0.07, 1), roughness=0.6)
pad = common.material("trackpad", color=(0.66, 0.67, 0.68, 1), roughness=0.25, metallic=0.7)
bezel = common.material("bezel", color=(0.02, 0.02, 0.02, 1), roughness=0.4)
screen = common.material("screen", color=(0.13, 0.2, 0.17, 1), roughness=0.2)

parts = []
parts.append(common.box("base", (W, D, base_t), location=(0, 0, base_t / 2), mat=alu, bevel=0.004))
parts.append(common.box("keyboard", (W * 0.86, D * 0.42, 0.0012), location=(0, D * 0.17, base_t + 0.0004), mat=dark))
parts.append(common.box("trackpad", (W * 0.42, D * 0.3, 0.0008), location=(0, -D * 0.27, base_t + 0.0002), mat=pad))

# Lid, built standing straight up at the back edge, then rotated around the hinge.
hy = D / 2 - lid_t / 2
lid_parts = [
    common.box("lid", (W, lid_t, D), location=(0, hy, base_t + D / 2), mat=alu, bevel=0.003),
    common.box("bezel", (W * 0.985, 0.0008, D * 0.975), location=(0, hy - lid_t / 2 - 0.0002, base_t + D / 2), mat=bezel),
    common.box("screen", (W * 0.94, 0.0008, D * 0.9), location=(0, hy - lid_t / 2 - 0.0006, base_t + D / 2 + D * 0.01), mat=screen),
]
# Straight up is 90 degrees open; tilt back by (angle - 90) around the hinge line.
hinge = Vector((0, hy, base_t))
rot = Matrix.Translation(hinge) @ Matrix.Rotation(-math.radians(angle - 90), 4, "X") @ Matrix.Translation(-hinge)
for p in lid_parts:
    p.matrix_world = rot @ p.matrix_world

common.export_glb(out)
