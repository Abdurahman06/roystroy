"""Create a web-only copy; never overwrite the supplied model."""
import json
import math
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "3д" / "Exterior+home+design.glb"
OUTPUT = ROOT / "public" / "models" / "exterior-preview.glb"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))

def triangles(mesh):
    return sum(len(face.vertices) - 2 for face in mesh.polygons)

before = sum(triangles(o.data) for o in bpy.context.scene.objects if o.type == "MESH")
for obj in list(bpy.context.scene.objects):
    if obj.type != "MESH":
        continue
    bpy.context.view_layer.objects.active = obj
    if obj.data.users > 1:
        obj.data = obj.data.copy()
    original = triangles(obj.data)
    if original > 2000:
        planar = obj.modifiers.new("Planar cleanup", "DECIMATE")
        planar.decimate_type = "DISSOLVE"
        planar.angle_limit = math.radians(0.5)
        planar.delimit = {"MATERIAL", "UV"}
        bpy.ops.object.modifier_apply(modifier=planar.name)
    remaining = triangles(obj.data)
    limit = 2500 if obj.name.startswith("Bolt") or original > 50000 else 10000
    if remaining > limit:
        simplify = obj.modifiers.new("Web detail", "DECIMATE")
        simplify.ratio = limit / remaining
        simplify.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=simplify.name)
    print(f"{obj.name}: {original} -> {triangles(obj.data)}", flush=True)

after = sum(triangles(o.data) for o in bpy.context.scene.objects if o.type == "MESH")
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT), export_format="GLB", export_extras=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=16,
    export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
)
print(json.dumps({"source_bytes": SOURCE.stat().st_size, "output_bytes": OUTPUT.stat().st_size,
                  "triangles_before": before, "triangles_after": after}), flush=True)
