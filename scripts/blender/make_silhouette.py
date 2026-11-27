"""Build a thin object from a cutout photo: trace its outline, extrude, put the photo on the face.

  blender --background --python scripts/blender/make_silhouette.py -- \
      <cutout.png> <length_m> <thickness_m> <out.glb> \
      [--body-depth D] [--body-color R G B] [--back-color R G B]

  cutout.png   photo with a transparent background (assets/_source/cutouts/).
  length_m     real length of the object's long axis. The outline is straightened
               so the long axis is vertical, then scaled to this length.
  thickness_m  thickness of the whole silhouette (the neck, the shaft).
  --body-depth deeper section for the wide part (a guitar body): every row of the
               outline that is wider than half the maximum width gets this depth.
  --body-color color of the body's sides (0-1 RGB).
  --back-color color of the back face. Without it the back repeats the photo.

Front faces -Y in Blender (+Z in glTF). Works best for flat-ish objects shot
straight on: guitars, ice axes, tools.
"""
import math
import os
import sys
from collections import deque

import bmesh
import bpy
import numpy as np

sys.path.append(os.path.dirname(__file__))
import common  # noqa: E402

a = common.args()
src, length, thick, out = a[0], float(a[1]), float(a[2]), a[3]
opt = lambda k, n=1: [float(v) for v in a[a.index(k) + 1:a.index(k) + 1 + n]] if k in a else None  # noqa: E731
body_depth = (opt("--body-depth") or [None])[0]
body_color = tuple(opt("--body-color", 3) or (0.55, 0.38, 0.22)) + (1.0,)
back_color = opt("--back-color", 3)

common.reset()
img = bpy.data.images.load(os.path.abspath(src))
W, H = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(H, W, 4)[::-1]  # top row first
alpha = px[:, :, 3] > 0.5

# Work on a downsampled mask for tracing.
step = max(1, int(max(W, H) / 420))
m = alpha[::step, ::step]
h, w = m.shape

# Keep the largest connected blob.
lab = np.zeros(m.shape, dtype=np.int32)
best, best_n, cur = 0, 0, 0
for y in range(h):
    for x in range(w):
        if m[y, x] and not lab[y, x]:
            cur += 1
            q = deque([(y, x)])
            lab[y, x] = cur
            n = 0
            while q:
                cy, cx = q.popleft()
                n += 1
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < h and 0 <= nx < w and m[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = cur
                        q.append((ny, nx))
            if n > best_n:
                best, best_n = cur, n
m = np.pad(lab == best, 1)


def trace(mask):
    """Moore-neighbor boundary trace. Returns [(y, x)] around the outer edge."""
    ys, xs = np.nonzero(mask)
    i = np.lexsort((xs, ys))[0]
    p0 = (int(ys[i]), int(xs[i]))
    dirs = [(-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1)]
    p, b = p0, (p0[0], p0[1] - 1)
    pts = [p0]
    for _ in range(mask.size):
        d = dirs.index((b[0] - p[0], b[1] - p[1]))
        for k in range(1, 9):
            idx = (d + k) % 8
            qy, qx = p[0] + dirs[idx][0], p[1] + dirs[idx][1]
            if mask[qy, qx]:
                pb = dirs[(idx - 1) % 8]
                b = (p[0] + pb[0], p[1] + pb[1])
                p = (qy, qx)
                break
        if p == p0:
            break
        pts.append(p)
    return pts


def rdp(pts, eps):
    """Ramer-Douglas-Peucker simplification."""
    if len(pts) < 3:
        return pts
    a_, b_ = np.array(pts[0], float), np.array(pts[-1], float)
    ab = b_ - a_
    n = np.linalg.norm(ab) or 1.0
    d = [abs(np.cross(ab, np.array(p, float) - a_)) / n for p in pts[1:-1]]
    i = int(np.argmax(d)) + 1
    if d[i - 1] > eps:
        return rdp(pts[: i + 1], eps)[:-1] + rdp(pts[i:], eps)
    return [pts[0], pts[-1]]


def outline(mask):
    pts = trace(mask)
    # Closed loop: split at the point farthest from the start, simplify each half.
    arr = np.array(pts, float)
    k = int(np.argmax(np.linalg.norm(arr - arr[0], axis=1)))
    pts = rdp(pts[: k + 1], 0.7)[:-1] + rdp(pts[k:] + [pts[0]], 0.7)[:-1]
    # back to full-resolution pixel coordinates (x, y_down)
    return np.array([((x - 1) * step, (y - 1) * step) for y, x in pts], dtype=float)


full = outline(m)

# Straighten: rotate so the long principal axis is vertical.
ys, xs = np.nonzero(m)
cov = np.cov(np.vstack([xs, ys]).astype(float))
ev, evec = np.linalg.eigh(cov)
major = evec[:, 1]
angle = math.atan2(major[0], major[1])  # tilt of the long axis away from vertical
if abs(angle) > math.pi / 2:
    angle -= math.copysign(math.pi, angle)
ca, sa = math.cos(angle), math.sin(angle)
center = np.array([W / 2, H / 2])


def to_world(pts):
    """Pixel (x, y_down) -> straightened, scaled (x, z) in meters, plus UVs."""
    rel = pts - center
    rx = rel[:, 0] * ca - rel[:, 1] * sa
    ry = rel[:, 0] * sa + rel[:, 1] * ca
    uv = np.column_stack([pts[:, 0] / W, 1 - pts[:, 1] / H])
    return np.column_stack([rx, -ry]), uv


xz, uv = to_world(full)
span = xz[:, 1].max() - xz[:, 1].min()
scale = length / span
print(f"tilt corrected {math.degrees(angle):.1f} deg, {len(full)} outline points")

photo = common.material("photo", roughness=0.6)
tex = photo.node_tree.nodes.new("ShaderNodeTexImage")
tex.image = img
photo.node_tree.links.new(tex.outputs["Color"], photo.node_tree.nodes["Principled BSDF"].inputs["Base Color"])
side = common.material("side", color=body_color, roughness=0.7)
back = common.material("back", color=tuple(back_color) + (1.0,), roughness=0.7) if back_color else photo


def slab(name, xz_pts, uv_pts, depth):
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    front = [bm.verts.new((x * scale, -depth / 2, z * scale)) for x, z in xz_pts]
    f = bm.faces.new(front)
    for loop in f.loops:
        loop[uvl].uv = uv_pts[front.index(loop.vert)]
    res = bmesh.ops.extrude_face_region(bm, geom=[f])
    new_verts = [e for e in res["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=new_verts, vec=(0, depth, 0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.triangulate(bm, faces=[fc for fc in bm.faces if len(fc.verts) > 4], quad_method="BEAUTY", ngon_method="BEAUTY")
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    me.materials.append(photo)
    me.materials.append(side)
    me.materials.append(back)
    for poly in me.polygons:
        ny = poly.normal.y
        poly.material_index = 0 if ny < -0.9 else (2 if ny > 0.9 else 1)
    return ob


parts = [slab("silhouette", xz, uv, thick)]

if body_depth:
    widths = m.sum(axis=1)
    rows = np.nonzero(widths > widths.max() * 0.5)[0]
    body_mask = m.copy()
    body_mask[: rows.min()] = False
    body_pts = outline(body_mask)
    bxz, buv = to_world(body_pts)
    parts.append(slab("body", bxz, buv, body_depth))
    # Keep the face flush: both slabs share the front plane.
    parts[-1].location.y = (body_depth - thick) / 2

for o in parts:
    o.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
common.export_glb(out)
