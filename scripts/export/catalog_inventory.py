import bpy
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path('/Users/macbook/Desktop/Codex of Teen/Projects/3D Model Designs/Concept-3D models ')
SOURCES = {
    'korea-pavilion': ROOT / 'Korean Pavilions/Korea_40Booths_v1/Korea_40Booths_v1.blend',
    'marun': ROOT / 'Marun/MARUN_Studio_v3/MARUN_Studio_v3.blend',
    'inol': ROOT / 'INOL Group/INOL_Studio_v1/INOL_Studio_v1.blend',
    'italy-pavilion': ROOT / 'Italy Pavilions/Italy_Pavilion_v1/Italy_Pavilion_v1.blend',
    'art-toy': ROOT / 'Art Toy model/Art toy Cenematic/Orange_Ocean_Atelier_v5_Final.blend',
}
OUT = Path(__file__).parent / 'inventory.json'

def bounds(objs):
    coords = [obj.matrix_world @ Vector(corner) for obj in objs if obj.type in {'MESH','CURVE','FONT','SURFACE'} for corner in obj.bound_box]
    if not coords: return None
    return [[round(min(c[i] for c in coords), 3) for i in range(3)], [round(max(c[i] for c in coords), 3) for i in range(3)]]

report = {}
for key, source in SOURCES.items():
    bpy.ops.wm.open_mainfile(filepath=str(source))
    report[key] = {
        'source':str(source),
        'collections': [{
            'name':c.name,'hidden':c.hide_render,
            'objects':len(c.objects), 'bounds':bounds(c.objects),
            'names':[o.name for o in c.objects][:20],
        } for c in bpy.data.collections if c.objects],
        'cameras': [{ 'name':o.name, 'location':list(o.matrix_world.translation), 'rotation':list(o.rotation_euler)} for o in bpy.data.objects if o.type == 'CAMERA'],
        'materials':[{ 'name':m.name,'diffuse':list(m.diffuse_color), 'nodes':[n.type for n in m.node_tree.nodes] if m.use_nodes and m.node_tree else []} for m in bpy.data.materials],
        'meshObjects':sum(o.type == 'MESH' for o in bpy.data.objects),
        'visibleMeshObjects':sum(o.type == 'MESH' and not o.hide_render for o in bpy.data.objects),
        'vertices':sum(len(o.data.vertices) for o in bpy.data.objects if o.type == 'MESH'),
    }
    OUT.write_text(json.dumps(report,indent=2))
    print('INVENTORY',key,'done',flush=True)
