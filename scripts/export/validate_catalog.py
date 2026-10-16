"""Round-trip every exported GLB and render independent visual QA thumbnails."""
import bpy
import json
import math
import struct
from pathlib import Path
from mathutils import Vector

REPO=Path(__file__).resolve().parents[2]
OUT=Path(__file__).parent/'review'
OUT.mkdir(exist_ok=True)
report=[]
for source in sorted((REPO/'public/models/catalog').glob('*.glb')):
    data=source.read_bytes()
    magic,version,total=struct.unpack_from('<III',data,0)
    assert magic==0x46546C67 and version==2 and total==len(data)
    size,kind=struct.unpack_from('<II',data,12)
    gltf=json.loads(data[20:20+size])
    assert gltf['meshes'] and gltf['materials']
    assert not any('uri' in image for image in gltf.get('images',[])), 'Textures must be embedded'
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source))
    scene=bpy.context.scene
    objects=[o for o in scene.objects if o.type=='MESH']
    coords=[o.matrix_world@Vector(v) for o in objects for v in o.bound_box]
    low=Vector(tuple(min(c[i] for c in coords) for i in range(3)))
    high=Vector(tuple(max(c[i] for c in coords) for i in range(3)))
    assert all(math.isfinite(x) for x in (*low,*high)) and all(high[i]>low[i] for i in range(3))
    extent=high-low
    target=(low+high)/2
    span=max(extent)
    camera_data=bpy.data.cameras.new('Review camera')
    camera=bpy.data.objects.new('Review camera',camera_data)
    scene.collection.objects.link(camera)
    camera.location=target+Vector((-1.1,-1.55,1.05))*span
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    camera_data.type='ORTHO';camera_data.ortho_scale=span*1.4
    scene.camera=camera
    world=bpy.data.worlds.new('Neutral studio');world.use_nodes=True
    world.node_tree.nodes.get('Background').inputs[0].default_value=(.55,.58,.62,1)
    world.node_tree.nodes.get('Background').inputs[1].default_value=.7
    scene.world=world
    for index,offset in enumerate([(-1,-1,2),(1,-.3,1.5),(.5,1.2,1.8)]):
        light_data=bpy.data.lights.new('Review softbox','AREA');light_data.energy=span*span*30;light_data.shape='DISK';light_data.size=span
        light=bpy.data.objects.new(f'Review softbox {index}',light_data);scene.collection.objects.link(light)
        light.location=target+Vector(offset)*span
        light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
    scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=True;scene.cycles.device='CPU'
    scene.render.resolution_x=720;scene.render.resolution_y=540;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
    scene.render.filepath=str(OUT/f'{source.stem}.png')
    bpy.ops.render.render(write_still=True)
    item={'id':source.stem,'validGLB':True,'embeddedImages':len(gltf.get('images',[])),
      'meshes':len(objects),'primitives':sum(len(m['primitives']) for m in gltf['meshes']),
      'triangles':sum(len(p.vertices)-2 for o in objects for p in o.data.polygons),
      'blenderBounds':{'min':list(low),'max':list(high)},'bytes':len(data)}
    report.append(item)
    (OUT/'validation.json').write_text(json.dumps(report,indent=2))
    print('VALIDATED',json.dumps(item),flush=True)
