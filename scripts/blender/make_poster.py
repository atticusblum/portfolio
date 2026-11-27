"""Build a poster as a thin paper plane with the print on its face.

  blender --background --python scripts/blender/make_poster.py -- \
      <image.jpg> <height_cm> <out.glb> [--frame]

  image      the poster file (e.g. assets/matterhorn.jpg). Downscaled to 1024 px on export.
  height_cm  real height of the print on your wall. Width follows the image's aspect ratio.
  --frame    add a thin black frame. Without it, the print is bare paper.

Front faces -Y in Blender (+Z in glTF). Origin at the center of the back, so
it sits flat on the wall slot.
"""
import os
import sys

import bpy

sys.path.append(os.path.dirname(__file__))
import common  # noqa: E402

a = common.args()
image, height_cm, out = a[0], float(a[1]), a[2]
framed = "--frame" in a

common.reset()
img = bpy.data.images.load(os.path.abspath(image))
aspect = img.size[0] / img.size[1]
h = height_cm / 100
w = h * aspect
paper = 0.0015

# Face: a plane with the print, UVs spanning the whole image.
# Sits a hair in front of the paper block so the two faces don't z-fight.
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -paper - 0.0006, 0), rotation=(1.5708, 0, 0))
face = bpy.context.object
face.name = "print"
face.scale = (w, h, 1)
bpy.ops.object.transform_apply(scale=True, rotation=True)
mat = common.material("print", roughness=0.85)
tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
tex.image = img
mat.node_tree.links.new(tex.outputs["Color"], mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"])
face.data.materials.append(mat)

# Paper body behind it (edges and back), plain off-white.
common.box("paper", (w, paper, h), location=(0, -paper / 2, 0),
           mat=common.material("paper", color=(0.9, 0.89, 0.85, 1.0), roughness=0.9))

if framed:
    t, depth = 0.012, 0.02
    frame = common.material("frame", color=(0.05, 0.05, 0.05, 1.0), roughness=0.5)
    for name, size, loc in [
        ("top", (w + 2 * t, depth, t), (0, -depth / 2, h / 2 + t / 2)),
        ("bottom", (w + 2 * t, depth, t), (0, -depth / 2, -h / 2 - t / 2)),
        ("left", (t, depth, h), (-w / 2 - t / 2, -depth / 2, 0)),
        ("right", (t, depth, h), (w / 2 + t / 2, -depth / 2, 0)),
    ]:
        common.box(f"frame_{name}", size, location=loc, mat=frame)

common.export_glb(out)
