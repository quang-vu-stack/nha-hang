"""VIETNAM LIFE 3D — safe Blender world enhancement + GLB export.
Usage: blender --background VIETNAM_LIFE_3D_HANOI_WORLD.blend --python tools/blender_finalize_hanoi.py
Requires Blender with bpy; this script must run against the user's local .blend file.
Does NOT modify the source .blend: saves a new enhanced copy in HANOI_WORLD_V04_OUTPUT.
"""
import bpy
import json
import math
import os
import traceback
from pathlib import Path
from mathutils import Vector

PROJECT_TAG = "VIETNAM_LIFE_3D_V04"
OUTNAME = "HANOI_WORLD_V04_OUTPUT"
COLLECTION = "14_HANOI_EXPANSION_V04"

def ensure_collection(name):
    collection = bpy.data.collections.get(name)
    if not collection:
        collection = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(collection)
    return collection

def material(name, color, metallic=0.0, roughness=0.75):
    key = PROJECT_TAG + "_" + name
    m = bpy.data.materials.get(key)
    if m:
        return m
    m = bpy.data.materials.new(key)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*color, 1)
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
    return m

def into(obj, target):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    target.objects.link(obj)
    obj[PROJECT_TAG] = True
    return obj

def box(name, pos, size, mat, target):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.name = PROJECT_TAG + "_" + name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    return into(obj, target)

def cylinder(name, pos, radius, depth, mat, target, vertices=12, rotate=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=pos)
    obj = bpy.context.object
    obj.name = PROJECT_TAG + "_" + name
    if rotate:
        obj.rotation_euler = rotate
    obj.data.materials.append(mat)
    return into(obj, target)

def sphere(name, pos, radius, mat, target):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=radius, location=pos)
    obj = bpy.context.object
    obj.name = PROJECT_TAG + "_" + name
    obj.data.materials.append(mat)
    return into(obj, target)

def bar_between(name, p1, p2, radius, mat, target):
    delta = Vector(p2) - Vector(p1)
    if delta.length < 0.001:
        return
    mid = (Vector(p1) + Vector(p2)) / 2
    ob = cylinder(name, mid, radius, delta.length, mat, target, vertices=8)
    ob.rotation_euler = delta.to_track_quat("Z", "Y").to_euler()
    return ob

def text_mesh(name, value, pos, size, mat, target, rotation=None):
    bpy.ops.object.text_add(location=pos)
    o = bpy.context.object
    o.name = PROJECT_TAG + "_" + name
    o.data.body = value
    o.data.size = size
    o.data.extrude = 0.005
    if rotation:
        o.rotation_euler = rotation
    bpy.ops.object.convert(target="MESH")
    o = bpy.context.object
    o.data.materials.append(mat)
    return into(o, target)

def street_tree(x, y, prefix, coll, bark, green):
    cylinder(prefix+"_TRUNK", (x,y,2.05), .19, 4.1, bark, coll, 10)
    sphere(prefix+"_LEAVES", (x,y,5.35), 2.15, green, coll)
    sphere(prefix+"_TOP", (x+.6,y+.3,6.3), 1.55, green, coll)

def motorbike(x, y, prefix, coll, tire, metal, paint, seat):
    # Scooter silhouette with two separate vertical wheels; local longitudinal axis X.
    for dx in [-.60,.60]:
        cylinder(prefix+"_TIRE", (x+dx,y,.31), .30, .13, tire, coll, 18, (math.pi/2,0,0))
        cylinder(prefix+"_HUB", (x+dx,y,.31), .12, .15, metal, coll, 12, (math.pi/2,0,0))
    box(prefix+"_BODY", (x,y,.63), (1.14,.38,.27), paint, coll)
    box(prefix+"_SEAT", (x-.13,y,1.02), (.80,.35,.13), seat, coll)
    box(prefix+"_FRONT", (x+.50,y,.92), (.30,.32,.75), paint, coll)
    bar_between(prefix+"_FORK", (x+.58,y,.32), (x+.48,y,1.22), .065, metal, coll)
    bar_between(prefix+"_HANDLE", (x+.48,y-.33,1.30), (x+.48,y+.33,1.30), .045, metal, coll)
    sphere(prefix+"_LIGHT", (x+.68,y,1.04), .11, material("headlight",(0.96,.87,.58)), coll)

def street_lamp(x,y,prefix,coll,metal,light):
    cylinder(prefix+"_POLE",(x,y,3.25),.105,6.5,metal,coll,10)
    bar_between(prefix+"_ARM",(x,y,6.25),(x+.95,y,6.25),.055,metal,coll)
    box(prefix+"_LAMP",(x+.93,y,6.14),(.47,.27,.14),light,coll)

def market_table(x,y,prefix,coll,blue,steel):
    box(prefix+"_TOP",(x,y,.74),(1.12,.72,.065),steel,coll)
    for dx in [-.45,.45]:
        for dy in [-.27,.27]:
            cylinder(prefix+"_LEG",(x+dx,y+dy,.37),.035,.70,steel,coll,8)
    for dx,dy in [(-.78,0),(.78,0)]:
        box(prefix+"_STOOL",(x+dx,y,.41),(.39,.35,.06),blue,coll)
        for lx in [-.12,.12]:
            for ly in [-.10,.10]:
                box(prefix+"_STOOL_LEG",(x+dx+lx,y+ly,.205),(.045,.045,.36),blue,coll)

def add_zone(origin_x,origin_y,coll):
    asphalt=material("asphalt",(.20,.23,.25))
    pavement=material("pavement",(.58,.55,.48))
    painted=material("road_marking",(.86,.83,.69))
    wall_colors=[
        material("house_peach",(.68,.43,.37)),
        material("house_yellow",(.73,.63,.43)),
        material("house_cyan",(.45,.57,.56)),
        material("house_grey",(.59,.56,.54)),
        material("house_warm",(.70,.57,.47)),
    ]
    green=material("foliage",(.17,.37,.19))
    bark=material("tree_bark",(.29,.19,.12))
    window=material("window_glass",(.20,.32,.38),roughness=.18)
    steel=material("steel",(.49,.52,.51),metallic=.55,roughness=.37)
    dark=material("dark",(.09,.11,.12))
    warm=material("lamp_warm",(1,.74,.36))
    blue=material("plastic_blue",(.10,.25,.49))
    paints=[material("bike_red",(.57,.11,.09)),material("bike_blue",(.07,.20,.42)),
            material("bike_silver",(.38,.40,.43))]
    # A compact connected Hanoi side street, placed beside the user's existing world.
    def pt(x,y,z=0):
        return (origin_x+x,origin_y+y,z)
    box("NEW_ROAD",pt(0,0,.0),(122,13,.16),asphalt,coll)
    # Short bridge to the existing world edge; preserve the original road and terrain.
    box("CONNECTOR_ROAD",pt(-69,0,.0),(18,13,.16),asphalt,coll)
    for side in [-1,1]:
        box("CONNECTOR_SIDEWALK",pt(-69,side*9.0,.10),(18,4.5,.19),pavement,coll)
    for side in [-1,1]:
        box("SIDEWALK",pt(0,side*9.0,.10),(122,4.5,.19),pavement,coll)
    for x in range(-54,58,9):
        box("LANE_DASH",pt(x,0,.09),(4.2,.14,.012),painted,coll)
    for y in [-4.5,4.5]:
        for x in range(-58,-51,1):
            box("CROSSWALK",pt(x,y,.10),(.54,.62,.013),painted,coll)
    # Tube houses and shopfronts, spaced along both sides.
    for i in range(10):
        x=-51+i*11.3
        for side in [-1,1]:
            y=side*18.0
            h=9.3+((i+int(side>0))%4)*2.3
            wall=wall_colors[(i+int(side>0))%len(wall_colors)]
            box("TUBEHOUSE_%d_%d"%(i,side),pt(x,y,h/2),(9.1,11.5,h),wall,coll)
            box("TUBEHOUSE_ROOF",pt(x,y,h+.18),(9.6,11.9,.37),dark,coll)
            # Window orientation faces street, keep high enough above storefronts.
            front_y=y-side*5.82
            for floor in range(1,int((h-1.6)//3.15)+1):
                z=2.4+floor*2.65
                if z+1.1 >= h:
                    continue
                for dx in [-2.3,2.3]:
                    box("WINDOW",pt(x+dx,front_y,z),(1.55,.07,1.38),window,coll)
                    box("WINDOW_SILL",pt(x+dx,front_y-side*.16,z-.77),(1.76,.33,.10),steel,coll)
            box("SHOP_SHUTTER",pt(x,front_y,1.65),(5.2,.09,3.2),dark,coll)
            box("SHOP_SIGN",pt(x,front_y-side*.2,4.0),(7.6,.20,1.0),paints[i%len(paints)],coll)
            # Terrace + simple water tank
            if i%3==0:
                cylinder("WATER_TANK",pt(x+2,y+1,h+.8),.55,1.25,steel,coll,12)
                box("BALCONY",pt(x-1.0,front_y-side*.34,h-3), (7,.55,.12),steel,coll)
    for i in range(8):
        x=-51+i*15
        street_tree(*pt(x,-8.1)[:2],"TREE_%d"%i,coll,bark,green)
        street_lamp(*pt(x+5,8.1)[:2],"LAMP_%d"%i,coll,steel,warm)
    for i in range(7):
        motorbike(*pt(-47+i*15.5,6.9)[:2],"SCOOTER_%d"%i,coll,dark,steel,paints[i%3],dark)
    # Food tables on sidewalk: separate from existing main restaurant to avoid duplication.
    for i in range(5):
        market_table(*pt(-43+i*8.5,-9.0)[:2],"STREET_TABLE_%d"%i,coll,blue,steel)
    # Consistent lamp-lit evening / day preview. The game will own runtime day-night changes.
    return {
        "expansion_origin":[round(origin_x,2),round(origin_y,2)],
        "house_units":20,"trees":8,"lamps":8,"parked_motorbikes":7,"tables":5,
    }

def safe_world_bbox():
    mn = Vector((1e10,1e10,1e10))
    mx = Vector((-1e10,-1e10,-1e10))
    count=0
    for o in bpy.data.objects:
        if o.type != 'MESH' or not o.bound_box:
            continue
        try:
            for vert in o.bound_box:
                v=o.matrix_world @ Vector(vert)
                for j in range(3):
                    mn[j]=min(mn[j],v[j])
                    mx[j]=max(mx[j],v[j])
            count+=1
        except Exception:
            pass
    if count==0:
        return -50,50,-50,50
    return mn.x,mx.x,mn.y,mx.y

def ensure_game_marker(name, location):
    if name in bpy.data.objects:
        return
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=location)
    o=bpy.context.object
    o.name=name
    o.empty_display_size=.65
    target=ensure_collection("13_GAME_MARKERS")
    into(o,target)

def summarize(out_dir,info,exports):
    totals={"meshes":0,"triangles_approx":0,"armatures":0,"actions":len(bpy.data.actions),"objects":len(bpy.data.objects)}
    missing=[]
    for ob in bpy.data.objects:
        if ob.type=="MESH":
            totals["meshes"]+=1
            totals["triangles_approx"]+=sum(max(0,len(poly.vertices)-2) for poly in ob.data.polygons)
        if ob.type=="ARMATURE":
            totals["armatures"]+=1
    for image in bpy.data.images:
        if image.source=="FILE" and image.filepath:
            p=bpy.path.abspath(image.filepath)
            if not image.packed_file and not os.path.isfile(p):
                missing.append(p)
    report={
        "project":"VIETNAM LIFE 3D — Hanoi Blender v0.4 world",
        "source":bpy.data.filepath,
        "blender_version":bpy.app.version_string,
        "counts":totals,
        "new_zone":info,
        "exports":exports,
        "missing_textures":missing,
        "limitations":[
            "Scene geometry does not create gameplay AI, real-world GIS, or navigation mesh.",
            "GLB scene export is not proof of target-frame-rate performance.",
            "Preview lighting and NPC animations require manual inspection in Blender.",
        ],
    }
    (out_dir/"HANOI_WORLD_BUILD_REPORT.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    lines=["VIETNAM LIFE 3D — BLENDER WORLD V0.4","Source: "+report["source"],"Blender: "+report["blender_version"],
           "Objects: "+str(totals["objects"]),"Meshes: "+str(totals["meshes"]),
           "Approx triangles: "+str(totals["triangles_approx"]),"Armatures: "+str(totals["armatures"]),
           "Action datablocks: "+str(totals["actions"]),
           "GLB exports: "+str(sum(bool(x.get("ok")) for x in exports))+"/"+str(len(exports)),
           "Missing texture files: "+str(len(missing)),""]
    lines.extend((("OK " if x.get("ok") else "FAIL ")+x.get("name","")+": "+x.get("message","")) for x in exports)
    (out_dir/"HANOI_WORLD_BUILD_SUMMARY.txt").write_text("\n".join(lines),encoding="utf-8")
    return report

def export_group(out_dir, name, names):
    selections=[]
    seen=set()
    for coll_name in names:
        coll=bpy.data.collections.get(coll_name)
        if coll:
            for o in coll.all_objects:
                if o.type in {'MESH','ARMATURE','EMPTY'} and o.name not in seen:
                    selections.append(o)
                    seen.add(o.name)
    record={"name":name,"objects":len(selections),"ok":False}
    if not selections:
        record["message"]="No matching exportable objects"
        return record
    try:
        bpy.ops.object.select_all(action='DESELECT')
        for o in selections:
            o.hide_set(False)
            o.select_set(True)
        bpy.context.view_layer.objects.active=selections[0]
        dest=out_dir/"glb"/(name+".glb")
        bpy.ops.export_scene.gltf(filepath=str(dest),export_format='GLB',
                                  use_selection=True,export_animations=True)
        record["ok"]=dest.is_file() and dest.stat().st_size>128
        record["message"]=f"{len(selections)} objects; {dest.stat().st_size} bytes" if record["ok"] else "Export did not create GLB"
        record["path"]=str(dest.relative_to(out_dir))
    except Exception as ex:
        record["message"]=type(ex).__name__+": "+str(ex)
    return record

def main():
    if not bpy.data.filepath or not Path(bpy.data.filepath).is_file():
        raise RuntimeError("Open the original .blend before running this script")
    source=Path(bpy.data.filepath).resolve()
    output=source.parent/OUTNAME
    output.mkdir(parents=True,exist_ok=True)
    (output/"glb").mkdir(exist_ok=True)
    if source.parent==output:
        raise RuntimeError("Open the original Blender file, not a previous output copy")
    if bpy.context.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    col=ensure_collection(COLLECTION)
    if len(col.objects)==0:
        minx,maxx,miny,maxy=safe_world_bbox()
        ox=min(maxx+78, 2500)
        oy=(miny+maxy)*.5
        info=add_zone(ox,oy,col)
    else:
        info={"existing_expansion_objects":len(col.all_objects),"note":"Skipped duplicate generation"}
    ensure_game_marker("MARKER_EXPANSION_ENTRY",(info.get("expansion_origin",[0,0])[0]-55,
                                                  info.get("expansion_origin",[0,0])[1],.2))
    bpy.ops.wm.save_as_mainfile(filepath=str(output/"VIETNAM_LIFE_3D_HANOI_WORLD_V04.blend"))
    export_sets=[
        ("hanoi_original_streets",["01_HANOI_TERRAIN","02_HANOI_ROADS","03_HANOI_BUILDINGS","04_HANOI_STREET_PROPS"]),
        ("nhau_pho_viet",["05_NHAU_PHO_VIET_EXTERIOR","06_NHAU_PHO_VIET_INTERIOR","07_RESTAURANT_FURNITURE"]),
        ("vehicles_original",["08_VEHICLES"]),
        ("npc_original",["09_NPC_CHARACTERS","10_NPC_ANIMATIONS"]),
        ("hanoi_expansion_v04",[COLLECTION]),
    ]
    exports=[export_group(output,*x) for x in export_sets]
    report=summarize(output,info,exports)
    print("HANOI WORLD BUILD:",output)
    print("objects=",report["counts"]["objects"],"exports=",[x["ok"] for x in exports])
    if os.getenv("HANOI_RENDER_PREVIEW")=="1":
        try:
            scene=bpy.context.scene
            scene.render.resolution_x=1280
            scene.render.resolution_y=720
            scene.render.resolution_percentage=65
            scene.render.filepath=str(output/"HANOI_WORLD_CAMERA_PREVIEW.png")
            bpy.ops.render.render(write_still=True)
        except Exception:
            print("Preview render unavailable:",traceback.format_exc())

if __name__=="__main__":
    main()
