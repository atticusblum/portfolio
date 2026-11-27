"""Clean up the AI-generated JBL Clip.

  blender --background --python scripts/blender/clean_jbl.py -- <in.glb> <out.glb>

Input: the Tripo model after optimize + orient (roughly upright, grille toward
the front). Steps:
  1. Delete the detached hook piece: split into loose parts, keep the largest.
  2. Fill open holes (the stub ends) and report remaining open edges.
  3. Square it up: the AI model is tilted. Fit the body's principal axes,
     turn the flat axis to face front (Blender -Y = glTF +Z) and the stubs to point up.
  4. Check proportions against the JBL spec (body 97 mm across, 46 mm deep).
     Rescale depth only if it is more than 12% off.
  5. Front details, projected onto the domed grille:
     - three small raised buttons along the top: minus, play, plus
     - a shallow recessed logo plate near the bottom (boolean cut)
     Buttons use a slightly lighter version of the body's own average color;
     the recess floor a darker one. No new colors.
  6. Export .glb, 1024 px WebP textures.
"""
import math
import os
import sys

import bpy
import bmesh
import numpy as np
from mathutils import Matrix, Vector

sys.path.append(os.path.dirname(__file__))
import common  # noqa: E402

src, out = common.args()[:2]
common.reset()
bpy.ops.import_scene.gltf(filepath=os.path.abspath(src))

meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
body = bpy.context.view_layer.objects.active
# Bake every parent rotation (including the orient wrappers) into the mesh.
bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# 1. Remove the detached hook piece.
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.remove_doubles(threshold=0.0005)
bpy.ops.mesh.separate(type="LOOSE")
bpy.ops.object.mode_set(mode="OBJECT")
parts = sorted((o for o in bpy.context.scene.objects if o.type == "MESH"), key=lambda o: len(o.data.polygons), reverse=True)
print("parts:", [(p.name, len(p.data.polygons)) for p in parts])
body = parts[0]
for p in parts[1:]:
    bpy.data.objects.remove(p, do_unlink=True)
print(f"removed {len(parts) - 1} detached part(s)")

# 2. Close holes.
bpy.context.view_layer.objects.active = body
body.select_set(True)
print(f"open edges before fill: {common.watertight_report(body)}")
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.fill_holes(sides=0)
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode="OBJECT")
print(f"open edges after fill: {common.watertight_report(body)}")

# 3. Square it up with principal axes.
co = np.array([v.co[:] for v in body.data.vertices])
center = co.mean(axis=0)
evals, evecs = np.linalg.eigh(np.cov((co - center).T))
normal = Vector(evecs[:, 0])  # smallest spread = the puck's flat axis
if normal.dot(Vector((0, -1, 0))) < 0:  # grille already faces roughly -Y; keep that side front
    normal.negate()
up_guess = Vector((0, 0, 1))
up = (up_guess - normal * up_guess.dot(normal)).normalized()
right = up.cross(normal).normalized()
src_basis = Matrix((right, normal, up)).transposed()  # columns: right, front, up
dst_basis = Matrix(((1, 0, 0), (0, -1, 0), (0, 0, 1))).transposed()
R = (dst_basis @ src_basis.inverted()).to_4x4()
tilt = math.degrees(normal.angle(Vector((0, -1, 0))))
print(f"tilt corrected: {tilt:.1f} degrees")
body.data.transform(Matrix.Translation(-Vector(center)))
body.data.transform(R)
body.data.update()

# Put the origin at the body center, bottom at z=0 later by the site's slot fit.
dims = body.dimensions.copy()
print(f"dimensions (x width, y depth, z height): {tuple(round(d, 3) for d in dims)}")

# 4. Proportions: body width vs depth. Height includes the stubs, so use width.
ratio = dims.y / dims.x
target = 46 / 97
print(f"depth/width {ratio:.3f}, spec {target:.3f}")
if abs(ratio - target) / target > 0.12:
    s = target / ratio
    body.data.transform(Matrix.Diagonal((1, s, 1, 1)))
    body.data.update()
    print(f"rescaled depth by {s:.3f}")
dims = body.dimensions.copy()
mm = dims.x / 97  # one millimeter in model units

# Average body color for the details.
avg = (0.55, 0.12, 0.1)
for slot in body.material_slots:
    for n in slot.material.node_tree.nodes:
        if n.type == "TEX_IMAGE" and n.image:
            px = np.array(n.image.pixels[:]).reshape(-1, 4)
            # Image pixels are display (sRGB) values; material colors are linear.
            avg = tuple(float(c) ** 2.2 for c in px[:, :3].mean(axis=0))
            break
print("average color", tuple(round(c, 3) for c in avg))
btn_mat = common.material("buttons", color=tuple(min(1, c * 1.25) for c in avg) + (1.0,), roughness=0.55)
recess_mat = common.material("logo-recess", color=tuple(c * 0.55 for c in avg) + (1.0,), roughness=0.7)

# 5. Project onto the front surface.
bb = [Vector(c) for c in body.bound_box]
zmid = (min(v.z for v in bb) + max(v.z for v in bb)) / 2
body_top = max(v.z for v in bb)
radius = dims.x / 2
cz = body_top - (dims.z - dims.x) - radius  # disc center (height minus stub length)
cz = min(cz, zmid)
depsgraph = bpy.context.evaluated_depsgraph_get()


def surface(x, z):
    """Point and normal on the front surface at (x, z)."""
    hit, loc, nrm, *_ = body.ray_cast(Vector((x, -dims.y * 5, z)), Vector((0, 1, 0)))
    if not hit:
        raise RuntimeError(f"no front surface at x={x:.3f} z={z:.3f}")
    return loc, nrm


def align(ob, loc, nrm, push):
    """Place ob on the surface, its local +Z along the outward normal."""
    ob.rotation_mode = "QUATERNION"
    ob.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(nrm)
    ob.location = loc + nrm * push


def bar(w, h, t):
    bpy.ops.mesh.primitive_cube_add(size=1)
    b = bpy.context.object
    b.scale = (w, h, t)
    bpy.ops.object.transform_apply(scale=True)
    return b


details = []
thick = 1.6 * mm
y_btn = cz + radius * 0.66
for name, x in (("minus", -17), ("play", 0), ("plus", 17)):
    loc, nrm = surface(x * mm, y_btn)
    if name == "minus":
        shape = bar(8 * mm, 2 * mm, thick)
    elif name == "plus":
        shape = bar(8 * mm, 2 * mm, thick)
        v = bar(2 * mm, 8 * mm, thick)
        shape.select_set(True)
        v.select_set(True)
        bpy.context.view_layer.objects.active = shape
        bpy.ops.object.join()
    else:  # play: triangle pointing right
        bm = bmesh.new()
        tri = [bm.verts.new(p) for p in ((-3.5 * mm, -4 * mm, 0), (-3.5 * mm, 4 * mm, 0), (4.5 * mm, 0, 0))]
        f = bm.faces.new(tri)
        bmesh.ops.extrude_face_region(bm, geom=[f])
        bmesh.ops.translate(bm, verts=[v for v in bm.verts if v not in tri], vec=(0, 0, thick))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        me = bpy.data.meshes.new("play")
        bm.to_mesh(me)
        bm.free()
        shape = bpy.data.objects.new("play", me)
        bpy.context.scene.collection.objects.link(shape)
    shape.name = f"btn_{name}"
    shape.data.materials.clear()
    shape.data.materials.append(btn_mat)
    align(shape, loc, nrm, thick * 0.35)
    details.append(shape)

# Logo recess: cut a shallow pocket with a boolean, floor in the darker material.
loc, nrm = surface(0, cz - radius * 0.62)
cutter = bar(19 * mm, 14 * mm, 4 * mm)
cutter.name = "logo_cutter"
cutter.data.materials.append(recess_mat)
align(cutter, loc, nrm, 2 * mm - 1.0 * mm)  # sinks 1 mm into the surface
boolean = body.modifiers.new("logo", "BOOLEAN")
boolean.operation = "DIFFERENCE"
boolean.solver = "EXACT"
boolean.object = cutter
boolean.material_mode = "TRANSFER"
bpy.context.view_layer.objects.active = body
bpy.ops.object.modifier_apply(modifier=boolean.name)
bpy.data.objects.remove(cutter, do_unlink=True)

# Join details into the body.
bpy.ops.object.select_all(action="DESELECT")
for o in details + [body]:
    o.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.join()
print(f"final faces: {len(body.data.polygons)}, open edges: {common.watertight_report(body)}")

common.export_glb(out)
