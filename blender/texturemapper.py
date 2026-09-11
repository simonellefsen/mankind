"""Equirectangular TextureMapper for the MANKIND globe.

Maps lat/lon textures onto a UV sphere the same way Three.js SphereGeometry
does, so Blender bakes and the web globe stay aligned.
"""

from __future__ import annotations

import math
from pathlib import Path

import bpy


def lonlat_to_xyz(lon_deg: float, lat_deg: float, radius: float = 1.0):
    """Match Three.js SphereGeometry + u = (lon+180)/360, v = (lat+90)/180."""
    phi = math.radians(lon_deg + 180.0)
    theta = math.radians(90.0 - lat_deg)
    x = -math.cos(phi) * math.sin(theta) * radius
    y = math.cos(theta) * radius
    z = math.sin(phi) * math.sin(theta) * radius
    return (x, y, z)


def ensure_scene(name: str = "MankindGlobe"):
    if name in bpy.data.scenes:
        scene = bpy.data.scenes[name]
    else:
        scene = bpy.data.scenes.new(name)
    bpy.context.window.scene = scene
    return scene


def clear_scene_objects(scene):
    for obj in list(scene.objects):
        bpy.data.objects.remove(obj, do_unlink=True)


def load_image(path: Path, name: str):
    if name in bpy.data.images:
        img = bpy.data.images[name]
        img.filepath = str(path)
        img.reload()
        return img
    return bpy.data.images.load(str(path), check_existing=True)


def make_earth_material(day_path: Path, ice_path: Path, shelf_path: Path):
    mat = bpy.data.materials.get("MankindEarth") or bpy.data.materials.new("MankindEarth")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (900, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (600, 0)
    bsdf.inputs["Roughness"].default_value = 0.42
    bsdf.inputs["Specular IOR Level"].default_value = 0.35

    tex_day = nt.nodes.new("ShaderNodeTexImage")
    tex_day.location = (-400, 200)
    tex_day.image = load_image(day_path, "earth_day")
    tex_day.projection = "FLAT"

    tex_ice = nt.nodes.new("ShaderNodeTexImage")
    tex_ice.location = (-400, -80)
    tex_ice.image = load_image(ice_path, "earth_ice")
    tex_ice.projection = "FLAT"
    tex_ice.image.colorspace_settings.name = "Non-Color"

    tex_shelf = nt.nodes.new("ShaderNodeTexImage")
    tex_shelf.location = (-400, -360)
    tex_shelf.image = load_image(shelf_path, "earth_shelf")
    tex_shelf.projection = "FLAT"
    tex_shelf.image.colorspace_settings.name = "Non-Color"

    uv = nt.nodes.new("ShaderNodeTexCoord")
    uv.location = (-700, 0)

    mix_shelf = nt.nodes.new("ShaderNodeMix")
    mix_shelf.data_type = "RGBA"
    mix_shelf.location = (80, 80)
    mix_shelf.inputs["B"].default_value = (0.66, 0.58, 0.40, 1)

    mix_ice = nt.nodes.new("ShaderNodeMix")
    mix_ice.data_type = "RGBA"
    mix_ice.location = (300, 80)
    mix_ice.inputs["B"].default_value = (0.86, 0.93, 1.0, 1)

    nt.links.new(uv.outputs["UV"], tex_day.inputs["Vector"])
    nt.links.new(uv.outputs["UV"], tex_ice.inputs["Vector"])
    nt.links.new(uv.outputs["UV"], tex_shelf.inputs["Vector"])
    nt.links.new(tex_day.outputs["Color"], mix_shelf.inputs["A"])
    nt.links.new(tex_shelf.outputs["Color"], mix_shelf.inputs["Factor"])
    nt.links.new(mix_shelf.outputs["Result"], mix_ice.inputs["A"])
    nt.links.new(tex_ice.outputs["Color"], mix_ice.inputs["Factor"])
    nt.links.new(mix_ice.outputs["Result"], bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def make_atmosphere_material():
    mat = bpy.data.materials.get("MankindAtmosphere") or bpy.data.materials.new("MankindAtmosphere")
    mat.use_nodes = True
    mat.blend_method = "BLEND"
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emission = nt.nodes.new("ShaderNodeEmission")
    fresnel = nt.nodes.new("ShaderNodeFresnel")
    fresnel.inputs["IOR"].default_value = 1.12
    transparent = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    emission.inputs["Color"].default_value = (0.35, 0.55, 1.0, 1)
    emission.inputs["Strength"].default_value = 1.8
    nt.links.new(fresnel.outputs["Fac"], mix.inputs["Fac"])
    nt.links.new(transparent.outputs["BSDF"], mix.inputs[1])
    nt.links.new(emission.outputs["Emission"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return mat


def build_globe(tex_dir: Path, export_glb: Path, render_path: Path):
    scene = ensure_scene()
    clear_scene_objects(scene)

    scene.render.engine = "CYCLES"
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 900
    scene.render.film_transparent = True
    scene.render.filepath = str(render_path)
    scene.render.image_settings.file_format = "PNG"
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.012, 0.014, 0.02, 1)
        bg.inputs["Strength"].default_value = 0.25

    bpy.ops.mesh.primitive_uv_sphere_add(segments=128, ring_count=64, radius=1.0, location=(0, 0, 0))
    earth = bpy.context.active_object
    earth.name = "Earth"
    bpy.ops.object.shade_smooth()
    # Sphere UVs from the primitive already match equirectangular (u along lon).
    earth.data.materials.append(
        make_earth_material(tex_dir / "earth.jpg", tex_dir / "ice.png", tex_dir / "shelf.png")
    )

    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1.035, location=(0, 0, 0))
    atm = bpy.context.active_object
    atm.name = "Atmosphere"
    bpy.ops.object.shade_smooth()
    atm.data.materials.append(make_atmosphere_material())

    # Markers: Africa origin, Flores, Altai, Beringia
    mat_em = bpy.data.materials.get("Marker") or bpy.data.materials.new("Marker")
    mat_em.use_nodes = True
    mat_em.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (1, 0.78, 0.28, 1)
    mat_em.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 12

    for name, lon, lat in (
        ("JebelIrhoud", -8.87, 31.95),
        ("Flores", 120.95, -8.5),
        ("Denisova", 84.68, 51.4),
        ("Beringia", -168.0, 65.5),
        ("WhiteSands", -106.3, 32.8),
        ("Madjedbebe", 132.87, -12.5),
    ):
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.018, location=lonlat_to_xyz(lon, lat, 1.02))
        m = bpy.context.active_object
        m.name = name
        m.data.materials.append(mat_em)

    sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN"))
    sun.data.energy = 4.5
    sun.data.angle = 0.02
    sun.location = (3.5, 1.2, 2.4)
    sun.rotation_euler = (math.radians(-25), math.radians(20), math.radians(40))
    scene.collection.objects.link(sun)

    cam_data = bpy.data.cameras.new("GlobeCam")
    cam_data.lens = 85
    cam = bpy.data.objects.new("GlobeCam", cam_data)
    # Look at Africa
    cam.location = (2.55, 0.55, 1.15)
    scene.collection.objects.link(cam)
    scene.camera = cam
    track = cam.constraints.new("TRACK_TO")
    track.target = earth
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"

    export_glb.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.obj_export if False else None
    bpy.ops.export_scene.gltf(
        filepath=str(export_glb),
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_extras=True,
    )
    bpy.ops.render.render(write_still=True)
    return {"earth": earth.name, "glb": str(export_glb), "render": str(render_path)}
