"""Web-only exports; never saves over the supplied Blender documents.

Run Blender -b --python scripts/export/export_catalog.py -- [model id ...]
Booth geometry is preserved; photographic studios/halls are omitted. Procedural
base colors are sampled into web texture swatches, image graphics retained, and
mesh objects joined to keep draw calls practical for the interactive gallery.
"""
import bpy
import json
import math
import re
import sys
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
REPO = Path(__file__).resolve().parents[2]
OUT = REPO / 'public/models/catalog'
OUT.mkdir(parents=True, exist_ok=True)
WORK = Path(__file__).parent

def admitted(obj, key):
    if obj.type not in {'MESH','CURVE','FONT','SURFACE'} or obj.hide_render: return False
    if key == 'art-toy':
        if re.match(r'^(?:V5\s+)?Mall(?:\s|\|)', obj.name, re.I): return False
        return not any(c.name.startswith(('70_','71_','72_','73_')) or c.hide_render for c in obj.users_collection)
    return not any(c.hide_render or any(s in c.name.lower() for s in ('studio','exhibition hall')) for c in obj.users_collection)

def bounds(objs):
    coords = [obj.matrix_world @ Vector(v) for obj in objs for v in obj.bound_box]
    return Vector(tuple(min(c[i] for c in coords) for i in range(3))), Vector(tuple(max(c[i] for c in coords) for i in range(3)))

def upstream(socket, kind, seen=None):
    seen = seen or set()
    for link in socket.links:
        node = link.from_node
        if node in seen: continue
        seen.add(node)
        if node.type == kind: return node
        for inp in node.inputs:
            if inp.is_linked:
                found = upstream(inp,kind,seen)
                if found: return found
    return None

def bake_color(material, principled, key, index):
    """Sample a source color shader on a neutral plane; no lighting baked in."""
    old_scene = bpy.context.window.scene
    bake_scene = bpy.data.scenes.new('WEB texture swatch')
    bpy.context.window.scene = bake_scene
    bake_scene.render.engine = 'CYCLES'
    bake_scene.cycles.samples = 1
    bake_scene.cycles.device = 'CPU'
    mesh = bpy.data.meshes.new('swatch')
    mesh.from_pydata([(0,0,0),(1,0,0),(1,1,0),(0,1,0)],[],[(0,1,2,3)])
    mesh.uv_layers.new(name='WebOriginalUV')
    for loop, uv in zip(mesh.uv_layers.active.data,[(0,0),(1,0),(1,1),(0,1)]): loop.uv=uv
    plane = bpy.data.objects.new('swatch',mesh)
    bake_scene.collection.objects.link(plane)
    copied = material.copy()
    plane.data.materials.append(copied)
    nt = copied.node_tree
    p = next(n for n in nt.nodes if n.name == principled.name)
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    emission = nt.nodes.new('ShaderNodeEmission')
    if p.inputs['Base Color'].is_linked:
        nt.links.new(p.inputs['Base Color'].links[0].from_socket, emission.inputs[0])
    else:
        emission.inputs[0].default_value = p.inputs['Base Color'].default_value
    nt.links.new(emission.outputs[0],out.inputs['Surface'])
    image = bpy.data.images.new(f'{key}-surface-{index:03d}',256,256,alpha=False)
    node = nt.nodes.new('ShaderNodeTexImage')
    node.image = image
    for n in nt.nodes: n.select=False
    node.select = True
    nt.nodes.active=node
    plane.select_set(True)
    bpy.context.view_layer.objects.active=plane
    bpy.ops.object.bake(type='EMIT',margin=0)
    image.pack()
    bpy.context.window.scene=old_scene
    bpy.data.objects.remove(plane,do_unlink=True)
    bpy.data.scenes.remove(bake_scene)
    bpy.data.materials.remove(copied)
    return image

def prepare_materials(objects,key):
    materials = sorted({m for o in objects for m in o.data.materials if m},key=lambda m:m.name)
    baked=set()
    for index,m in enumerate(materials):
        if not m.use_nodes: continue
        nt=m.node_tree
        p=next((n for n in nt.nodes if n.type=='BSDF_PRINCIPLED'),None)
        out=next((n for n in nt.nodes if n.type=='OUTPUT_MATERIAL'),None)
        if not p or not out: continue
        # The browser uses neutral environment light; retain authored graphics and
        # material colors, while converting Cycles-only shader combinations.
        color=p.inputs['Base Color']
        tex=upstream(color,'TEX_IMAGE') if color.is_linked else None
        vector_link=tex.inputs['Vector'].links[0] if tex and tex.inputs['Vector'].is_linked else None
        image_uses_uv = not vector_link or vector_link.from_node.type=='UVMAP' or (vector_link.from_node.type=='TEX_COORD' and vector_link.from_socket.name=='UV')
        if tex and tex.image and image_uses_uv:
            uv=nt.nodes.new('ShaderNodeUVMap');uv.uv_map='WebOriginalUV'
            nt.links.new(uv.outputs[0],tex.inputs['Vector'])
            nt.links.new(tex.outputs['Color'],color)
        elif color.is_linked:
            print('BAKE',key,m.name,flush=True)
            img=bake_color(m,p,key,index)
            uv=nt.nodes.new('ShaderNodeUVMap');uv.uv_map='WebSurfaceUV'
            tex=nt.nodes.new('ShaderNodeTexImage');tex.image=img
            nt.links.new(uv.outputs[0],tex.inputs['Vector'])
            nt.links.new(tex.outputs['Color'],color)
            baked.add(m)
        nt.links.new(p.outputs['BSDF'],out.inputs['Surface'])
        for socket_name in ('Normal','Roughness','Metallic'):
            for link in list(p.inputs[socket_name].links):nt.links.remove(link)
        glass = p.inputs['Transmission Weight'].default_value > .2 or (bool(re.search(r'\bglass\b',m.name,re.I)) and 'frame' not in m.name.lower()) or m.name.startswith('FROST')
        if glass:
            p.inputs['Transmission Weight'].default_value=0
            p.inputs['Alpha'].default_value=.18 if m.name.startswith('FROST') else .13
            p.inputs['Roughness'].default_value=.12
            m.surface_render_method='DITHERED'
        m.use_backface_culling=False
    for obj in objects:
        if obj.type!='MESH' or not any(m in baked for m in obj.data.materials):continue
        uv=obj.data.uv_layers.get('WebSurfaceUV') or obj.data.uv_layers.new(name='WebSurfaceUV')
        coords=[v.co for v in obj.data.vertices]
        if not coords:continue
        low=[min(c[i] for c in coords) for i in range(3)]
        span=[max(max(c[i] for c in coords)-low[i],.0001) for i in range(3)]
        for face in obj.data.polygons:
            if obj.data.materials[face.material_index] not in baked:continue
            dominant=max(range(3),key=lambda i:abs(face.normal[i]))
            axes=[i for i in range(3) if i!=dominant]
            for li in face.loop_indices:
                co=obj.data.vertices[obj.data.loops[li].vertex_index].co
                uv.data[li].uv=tuple((co[a]-low[a])/span[a] for a in axes)
    # Bound graphics resolution; originals remain packed in the source document.
    for m in materials:
        if not m.use_nodes:continue
        for node in m.node_tree.nodes:
            if node.type=='TEX_IMAGE' and node.image and max(node.image.size)>2048:
                image=node.image;ratio=2048/max(image.size)
                image.scale(max(1,int(image.size[0]*ratio)),max(1,int(image.size[1]*ratio)))
                image.pack()
    return len(materials), len(baked)

def export(key):
    bpy.ops.wm.open_mainfile(filepath=str(SOURCES[key]))
    scene=bpy.context.scene
    scene.frame_set(1)
    objects=[o for o in scene.objects if admitted(o,key)]
    # Remove excluded objects in memory only, preventing inherited studio parents
    # and collection visibility from leaking into the runtime export.
    for obj in list(scene.objects):
        if obj not in objects:
            for child in list(obj.children):
                matrix=child.matrix_world.copy();child.parent=None;child.matrix_world=matrix
            bpy.data.objects.remove(obj,do_unlink=True)
    for o in objects:
        o.hide_set(False);o.hide_viewport=False;o.hide_select=False
        o.select_set(True)
        # Production meshes use high render subdivisions. Retain silhouettes and
        # every component, with a sensible tessellation budget for the browser.
        if o.type in {'CURVE','FONT','SURFACE'}:
            o.data.resolution_u=min(o.data.resolution_u,8)
            o.data.bevel_resolution=min(o.data.bevel_resolution,2)
        for modifier in o.modifiers:
            if modifier.type=='SUBSURF':
                modifier.levels=min(modifier.levels,1)
                modifier.render_levels=min(modifier.render_levels,1)
            if modifier.type=='BEVEL':modifier.segments=min(modifier.segments,2)
    for c in bpy.data.collections:c.hide_viewport=False
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.convert(target='MESH')
    objects=[o for o in scene.objects if o.type=='MESH']
    for o in objects:
        o.select_set(True)
        o.data=o.data.copy()
        # Joining meshes must not silently turn graphic UVs into procedural UVs.
        # Give all authored UV channels a stable name and reference it explicitly.
        active=next((uv for uv in o.data.uv_layers if uv.active_render),o.data.uv_layers.active)
        if active:active.name='WebOriginalUV'
    for o in objects:
        if len(o.data.polygons)>1800:
            bpy.context.view_layer.objects.active=o
            modifier=o.modifiers.new('Web curvature tessellation','DECIMATE')
            modifier.ratio=max(.2,min(.65,1600/len(o.data.polygons)))
            bpy.ops.object.modifier_apply(modifier=modifier.name)
    low,high=bounds(objects)
    center=Vector(((low.x+high.x)/2,(low.y+high.y)/2,low.z))
    for o in objects:
        matrix=o.matrix_world.copy();o.parent=None;matrix.translation-=center;o.matrix_world=matrix
    count=len(objects)
    material_count,baked_count=prepare_materials(objects,key)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join()
    mesh=bpy.context.object
    mesh.name=key
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    triangles=sum(len(p.vertices)-2 for p in mesh.data.polygons)
    path=OUT/f'{key}.glb'
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,
        use_active_scene=True,export_animations=False,export_cameras=False,export_lights=False,
        export_yup=True,export_materials='EXPORT',export_apply=True,
        export_image_format='JPEG',export_image_quality=88,
        export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,
        export_draco_position_quantization=16,export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12)
    lo,hi=bounds([mesh])
    # glTF coordinates are x, z, -y (Y is up).
    report={'id':key,'source':str(SOURCES[key]),'src':f'/models/catalog/{key}.glb',
        'bytes':path.stat().st_size,'sourceMeshObjects':count,'triangles':triangles,
        'materials':material_count,'bakedProceduralColors':baked_count,
        'bounds':{'min':[round(lo.x,4),round(lo.z,4),round(-hi.y,4)],'max':[round(hi.x,4),round(hi.z,4),round(-lo.y,4)]},
        'notes':'Full booth geometry; studio removed; centered at ground. Procedural color swatches sampled for web; browser lighting differs from authored render.'}
    (WORK/f'{key}-export.json').write_text(json.dumps(report,indent=2))
    print('EXPORTED',json.dumps(report),flush=True)

keys=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else list(SOURCES)
for key in keys:export(key)
