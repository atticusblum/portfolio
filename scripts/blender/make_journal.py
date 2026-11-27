"""Build the physical journal as a closed hardcover notebook.

  blender --background --python scripts/blender/make_journal.py -- \
      [--size W H D] [--cover photo.jpg] [--color R G B] [--band] [--out assets/models/journal.glb]

  --size   width, height, thickness in cm. Default 14.8 21.0 2.0 is an A5 PLACEHOLDER;
           replace with your journal's real measurements.
  --cover  optional photo of the closed front cover, cropped straight-on to the edges.
           Without it the cover is a flat color.
  --color  cover color 0-1 RGB when there is no photo (default warm grey).
  --band   add an elastic closure band.

Parts: front and back cover boards, a rounded spine, a cream page block set in
from the edges, optional band. Built standing with the cover facing front
(-Y in Blender = +Z in glTF), like the other objects. The scene slot decides
how it sits on the desk (flat or standing).
"""
import os
import sys

import bpy

sys.path.append(os.path.dirname(__file__))
import common  # noqa: E402

a = common.args()
opt = lambda k, n=1: a[a.index(k) + 1:a.index(k) + 1 + n] if k in a else None  # noqa: E731
w, h, d = [float(v) / 100 for v in (opt("--size", 3) or (14.8, 21.0, 2.0))]
cover_img = (opt("--cover") or [None])[0]
color = tuple(float(v) for v in (opt("--color", 3) or (0.42, 0.40, 0.37))) + (1.0,)
out = (opt("--out") or ["assets/models/journal.glb"])[0]

common.reset()
board = 0.0025  # cover board thickness
overhang = 0.003  # covers stick out past the pages
cover = common.material("cover", color=color, roughness=0.75, image=cover_img)
plain = common.material("cover-back", color=color, roughness=0.75)
pages = common.material("pages", color=(0.93, 0.9, 0.82, 1.0), roughness=0.95)

# Front cover faces -Y. Thickness runs along Y.
common.box("cover_front", (w, board, h), location=(0, -d / 2 + board / 2, 0), mat=cover, bevel=0.0008)
common.box("cover_back", (w, board, h), location=(0, d / 2 - board / 2, 0), mat=plain, bevel=0.0008)
common.box("pages", (w - overhang * 2, d - board * 2, h - overhang * 2), location=(overhang, 0, 0), mat=pages)

# Rounded spine on the left edge (-X).
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=d / 2, depth=h, location=(-w / 2, 0, 0))
spine = bpy.context.object
spine.name = "spine"
spine.scale = (0.35, 1, 1)
bpy.ops.object.transform_apply(scale=True)
spine.data.materials.append(plain)

if "--band" in a:
    common.box("band", (0.008, d + 0.002, h + 0.001), location=(w / 2 - 0.025, 0, 0),
               mat=common.material("band", color=(0.08, 0.08, 0.08, 1.0), roughness=0.6))

# UV for the cover photo: project the front board straight on.
if cover_img:
    ob = bpy.data.objects["cover_front"]
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.cube_project(cube_size=1.0, scale_to_bounds=True)
    bpy.ops.object.mode_set(mode="OBJECT")

common.export_glb(out)
