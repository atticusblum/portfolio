"""Shared helpers for the Blender build scripts.

Run any script headless:
  blender --background --python scripts/blender/<script>.py -- [args]

Conventions (match the site's export spec):
  - Build in meters, real size. The site rescales to the slot anyway.
  - Blender is Z up; the glTF exporter converts to Y up.
  - The object's front faces Blender -Y, which exports as glTF +Z.
  - Export .glb with WebP textures, max 1024 px.
"""
import os
import sys

import bpy
import bmesh


def args():
    """Arguments after the `--` separator."""
    argv = sys.argv
    return argv[argv.index("--") + 1:] if "--" in argv else []


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, color=(0.6, 0.6, 0.6, 1.0), roughness=0.8, metallic=0.0, image=None):
    """Principled material, optionally with an image as base color."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if image:
        tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(os.path.abspath(image))
        mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def box(name, size, location=(0, 0, 0), mat=None, bevel=0.0):
    """Axis-aligned box. size = (x, y, z) in meters."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    ob = bpy.context.object
    ob.name = name
    ob.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        mod = ob.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        bpy.ops.object.modifier_apply(modifier=mod.name)
    if mat:
        ob.data.materials.append(mat)
    return ob


def resize_images(max_px=1024):
    for img in bpy.data.images:
        if img.size[0] > max_px or img.size[1] > max_px:
            s = max_px / max(img.size)
            img.scale(int(img.size[0] * s), int(img.size[1] * s))


def export_glb(path):
    resize_images(1024)
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=os.path.abspath(path),
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_image_format="WEBP",
        export_materials="EXPORT",
    )
    print(f"exported {path} ({os.path.getsize(path) / 1024:.0f} KB)")


def watertight_report(ob):
    """Counts boundary (open) edges. 0 means closed."""
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    open_edges = sum(1 for e in bm.edges if e.is_boundary)
    bm.free()
    return open_edges
