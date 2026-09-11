#!/usr/bin/env python3
"""Generate equirectangular globe overlays for MANKIND.

Outputs (public/textures):
  earth.jpg          cinematic day map
  earth_2k.jpg       mobile day map
  ice.png            LGM ice intensity (R) + core/margin encoding
  shelf.png          exposed continental shelf at ~-120 m
  landmask.png       land vs ocean
  specular.png       ocean specular mask
  clouds.png         thin procedural cloud veil
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
TEX = ROOT / "public" / "textures"
TEX.mkdir(parents=True, exist_ok=True)

W, H = 4096, 2048


def lonlat_grid(w: int, h: int) -> tuple[np.ndarray, np.ndarray]:
    lons = np.linspace(-180.0, 180.0, w, endpoint=False, dtype=np.float32)
    lats = np.linspace(90.0, -90.0, h, endpoint=False, dtype=np.float32)
    return np.meshgrid(lons, lats)


def wrap_dlon(lon: np.ndarray, clon: float) -> np.ndarray:
    return np.mod(lon - clon + 180.0, 360.0) - 180.0


def blob(
    lon: np.ndarray,
    lat: np.ndarray,
    clon: float,
    clat: float,
    rlon: float,
    rlat: float,
    value: float = 1.0,
    power: float = 1.35,
) -> np.ndarray:
    dlon = wrap_dlon(lon, clon)
    dlat = lat - clat
    t = (dlon / rlon) ** 2 + (dlat / rlat) ** 2
    fall = np.clip(1.0 - t, 0.0, 1.0)
    return (value * np.power(fall, power)).astype(np.float32)


def add(dst: np.ndarray, src: np.ndarray) -> None:
    np.maximum(dst, src, out=dst)


def classify_land(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    r = rgb[:, :, 0].astype(np.int16)
    g = rgb[:, :, 1].astype(np.int16)
    b = rgb[:, :, 2].astype(np.int16)
    snow = (r > 175) & (g > 185) & (b > 190) & (np.abs(r - g) < 40)
    # Deep navy / blue water of the Blue Marble source
    ocean = (b > r + 12) & (b > g + 8) & (r < 70) & (~snow)
    land = ~ocean
    return land.astype(np.float32), ocean.astype(np.float32)


def cinematic_grade(rgb: np.ndarray, land: np.ndarray) -> np.ndarray:
    img = rgb.astype(np.float32) / 255.0
    # Lift contrast slightly, warm the continents, crush ocean blacks
    img = np.clip((img - 0.04) * 1.08, 0, 1)
    warm = img * np.array([1.06, 1.01, 0.94], dtype=np.float32)
    cool = img * np.array([0.86, 0.92, 1.08], dtype=np.float32)
    land3 = land[..., None]
    graded = warm * land3 + cool * (1.0 - land3)
    # Subtle vignette in latitude (poles already icy)
    return np.clip(graded * 255.0, 0, 255).astype(np.uint8)


def ice_sheet(lon: np.ndarray, lat: np.ndarray) -> np.ndarray:
    ice = np.zeros(lon.shape, dtype=np.float32)

    # Permanent ice
    add(ice, blob(lon, lat, 0.0, -82.0, 180.0, 16.0, 1.0, 1.1))  # Antarctica
    add(ice, blob(lon, lat, -42.0, 73.0, 18.0, 12.0, 1.0, 1.2))  # Greenland
    add(ice, blob(lon, lat, -20.0, 82.0, 40.0, 8.0, 0.85, 1.2))

    # Laurentide (Canada + northern US). Yukon/Beringia kept mostly ice-free.
    add(ice, blob(lon, lat, -88.0, 58.0, 42.0, 20.0, 1.0, 1.15))
    add(ice, blob(lon, lat, -75.0, 52.0, 22.0, 14.0, 0.95, 1.2))
    add(ice, blob(lon, lat, -68.0, 48.0, 14.0, 9.0, 0.85, 1.25))
    add(ice, blob(lon, lat, -95.0, 48.0, 22.0, 10.0, 0.9, 1.2))
    add(ice, blob(lon, lat, -110.0, 54.0, 16.0, 10.0, 0.8, 1.2))
    add(ice, blob(lon, lat, -80.0, 62.0, 28.0, 14.0, 0.95, 1.15))
    add(ice, blob(lon, lat, -55.0, 60.0, 14.0, 12.0, 0.7, 1.3))  # Labrador / Grand Banks

    # Cordilleran (BC / Alaska ranges — not the Beringian interior)
    add(ice, blob(lon, lat, -128.0, 56.0, 12.0, 12.0, 0.92, 1.2))
    add(ice, blob(lon, lat, -138.0, 61.0, 10.0, 8.0, 0.8, 1.25))
    add(ice, blob(lon, lat, -150.0, 61.0, 10.0, 6.0, 0.7, 1.3))

    # Fennoscandian + British-Irish + Barents
    add(ice, blob(lon, lat, 22.0, 64.0, 24.0, 14.0, 1.0, 1.15))
    add(ice, blob(lon, lat, 10.0, 58.0, 14.0, 8.0, 0.88, 1.2))
    add(ice, blob(lon, lat, 30.0, 58.0, 16.0, 8.0, 0.8, 1.25))
    add(ice, blob(lon, lat, -4.0, 56.0, 10.0, 7.0, 0.9, 1.2))
    add(ice, blob(lon, lat, 50.0, 74.0, 22.0, 8.0, 0.85, 1.2))
    add(ice, blob(lon, lat, 60.0, 68.0, 14.0, 7.0, 0.55, 1.3))

    # Alpine / Pyrenees / Caucasus / Zagros / Himalaya (mountain ice)
    add(ice, blob(lon, lat, 8.5, 46.5, 4.5, 1.8, 0.75, 1.4))
    add(ice, blob(lon, lat, 0.5, 42.7, 2.8, 1.1, 0.55, 1.5))
    add(ice, blob(lon, lat, 44.0, 43.0, 3.5, 1.4, 0.6, 1.45))
    add(ice, blob(lon, lat, 78.0, 35.0, 14.0, 5.0, 0.55, 1.4))
    add(ice, blob(lon, lat, 90.0, 33.0, 10.0, 4.0, 0.45, 1.4))

    # Patagonia + New Zealand + Iceland
    add(ice, blob(lon, lat, -73.0, -49.0, 6.0, 10.0, 0.85, 1.25))
    add(ice, blob(lon, lat, 170.0, -44.0, 5.0, 4.0, 0.55, 1.4))
    add(ice, blob(lon, lat, -18.0, 65.0, 4.0, 2.8, 0.9, 1.3))

    # Kamchatka / coastal NE Siberia mountain ice (interior Siberia stays steppe)
    add(ice, blob(lon, lat, 160.0, 58.0, 8.0, 6.0, 0.5, 1.35))

    # Ice-free Beringia: subtract a mask over the land bridge
    beringia = blob(lon, lat, -170.0, 64.0, 28.0, 10.0, 1.0, 1.1)
    beringia = np.maximum(beringia, blob(lon, lat, 175.0, 64.0, 22.0, 9.0, 1.0, 1.1))
    ice *= 1.0 - 0.85 * beringia

    # Soft polar cap expansion at LGM
    add(ice, np.clip((lat - 62.0) / 22.0, 0, 1) ** 1.4 * 0.25)
    add(ice, np.clip((-62.0 - lat) / 14.0, 0, 1) ** 1.2 * 0.55)

    return np.clip(ice, 0.0, 1.0)


def exposed_shelf(lon: np.ndarray, lat: np.ndarray, land: np.ndarray) -> np.ndarray:
    """Schematic -120 m shelves: known ice-age land bridges + near-coast shallows."""
    # Distance-to-land via blur of the land mask (cheap shelf approximation)
    land_img = Image.fromarray((land * 255).astype(np.uint8), mode="L")
    near = np.array(land_img.filter(ImageFilter.GaussianBlur(radius=10)), dtype=np.float32) / 255.0
    far = np.array(land_img.filter(ImageFilter.GaussianBlur(radius=28)), dtype=np.float32) / 255.0
    ocean = 1.0 - land
    generic = ocean * np.clip((near - 0.08) * 1.6, 0, 1) * 0.35
    generic *= (np.abs(lat) < 72).astype(np.float32)

    shelf = generic.copy()

    def region(clon, clat, rlon, rlat, value=1.0, power=1.2):
        add(shelf, ocean * blob(lon, lat, clon, clat, rlon, rlat, value, power))

    # Beringia (Chukchi + Bering shelves) — the crucial ice-free land bridge
    region(-168.0, 64.0, 22.0, 10.0, 1.0, 1.05)
    region(175.0, 64.0, 18.0, 9.0, 1.0, 1.05)
    region(-175.0, 60.0, 16.0, 7.0, 0.85, 1.15)

    # Sunda Shelf: Malay Peninsula, Sumatra, Java, Borneo
    region(108.0, 2.0, 16.0, 12.0, 1.0, 1.05)
    region(104.0, 6.0, 12.0, 8.0, 0.9, 1.1)
    region(112.0, -4.0, 10.0, 6.0, 0.85, 1.15)

    # Sahul: Australia–New Guinea (Arafura, Torres) + Tasmania (Bass)
    region(137.0, -10.0, 14.0, 8.0, 1.0, 1.05)
    region(142.0, -10.0, 8.0, 5.0, 0.95, 1.1)
    region(146.0, -40.5, 6.0, 3.5, 0.9, 1.2)
    region(141.0, -17.0, 8.0, 8.0, 0.55, 1.2)

    # Doggerland + Channel + Irish Sea
    region(3.0, 54.0, 7.0, 3.2, 1.0, 1.1)
    region(0.5, 50.5, 3.5, 1.6, 0.9, 1.2)
    region(-4.5, 53.5, 3.0, 2.0, 0.7, 1.25)

    # East Asia shallows: Yellow Sea, Taiwan Strait, Hokkaido–Sakhalin
    region(122.0, 34.0, 8.0, 6.0, 0.85, 1.15)
    region(119.0, 24.0, 4.0, 2.5, 0.9, 1.2)
    region(142.0, 46.0, 6.0, 5.0, 0.8, 1.15)
    region(143.0, 52.0, 5.0, 4.0, 0.75, 1.2)

    # Persian Gulf, Adriatic, Arafura extras, Argentina shelf, SE US
    region(52.0, 27.0, 6.0, 4.0, 0.9, 1.15)
    region(15.0, 43.0, 5.0, 2.5, 0.7, 1.25)
    region(-68.0, -45.0, 8.0, 6.0, 0.45, 1.3)
    region(-83.0, 27.0, 8.0, 4.0, 0.4, 1.3)
    region(135.0, -15.0, 10.0, 6.0, 0.35, 1.25)

    # Do not paint deep trenches / open ocean
    shelf *= ocean
    # Keep Wallacea water gaps open: deep channels east of Bali / Sulawesi seas
    wallacea_gap = blob(lon, lat, 124.0, -4.0, 8.0, 7.0, 1.0, 1.1)
    wallacea_gap = np.maximum(wallacea_gap, blob(lon, lat, 128.0, -6.0, 6.0, 5.0, 0.8, 1.2))
    shelf *= 1.0 - 0.85 * wallacea_gap

    return np.clip(shelf, 0.0, 1.0)


def procedural_clouds(lon: np.ndarray, lat: np.ndarray) -> np.ndarray:
    # Lightweight fbm-ish bands — visual veil, not weather
    x = (lon + 180.0) / 360.0
    y = (90.0 - lat) / 180.0
    n = (
        0.55 * np.sin(x * 18.0 + np.sin(y * 9.0))
        + 0.30 * np.sin(x * 41.0 + y * 13.0)
        + 0.15 * np.sin(x * 90.0 - y * 27.0)
    )
    n = (n + 1.0) * 0.5
    band = np.clip(1.0 - np.abs(lat) / 78.0, 0, 1)
    clouds = np.clip((n - 0.42) * 2.2, 0, 1) ** 1.4 * band * 0.55
    return clouds.astype(np.float32)


def save_rgb(path: Path, arr: np.ndarray, size: tuple[int, int] | None = None, quality: int = 88) -> None:
    img = Image.fromarray(arr, mode="RGB")
    if size:
        img = img.resize(size, Image.Resampling.LANCZOS)
    img.save(path, quality=quality, optimize=True)


def save_gray(path: Path, arr: np.ndarray, size: tuple[int, int] | None = None) -> None:
    img = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8), mode="L")
    if size:
        img = img.resize(size, Image.Resampling.LANCZOS)
    img.save(path, optimize=True)


def save_rgba_from_gray(path: Path, arr: np.ndarray, rgb: tuple[int, int, int]) -> None:
    a = (np.clip(arr, 0, 1) * 255).astype(np.uint8)
    rgba = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.uint8)
    rgba[:, :, 0] = rgb[0]
    rgba[:, :, 1] = rgb[1]
    rgba[:, :, 2] = rgb[2]
    rgba[:, :, 3] = a
    Image.fromarray(rgba, mode="RGBA").save(path, optimize=True)


def main() -> None:
    src_path = TEX / "earth_source.jpg"
    src = Image.open(src_path).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    rgb = np.array(src)
    land, ocean = classify_land(rgb)
    lon, lat = lonlat_grid(W, H)

    graded = cinematic_grade(rgb, land)
    ice = ice_sheet(lon, lat)
    # Ice only over land + shelf-to-be; keep open ocean as sea ice only at high lat
    sea_ice = ocean * np.clip((np.abs(lat) - 52.0) / 18.0, 0, 1)
    ice = np.clip(ice * (land * 0.92 + 0.08) + sea_ice * 0.65, 0, 1)

    shelf = exposed_shelf(lon, lat, land)
    clouds = procedural_clouds(lon, lat)

    save_rgb(TEX / "earth.jpg", graded, quality=90)
    save_rgb(TEX / "earth_2k.jpg", graded, size=(2048, 1024), quality=86)
    save_gray(TEX / "ice.png", ice)
    save_gray(TEX / "shelf.png", shelf)
    save_gray(TEX / "landmask.png", land)
    save_gray(TEX / "specular.png", ocean)
    save_gray(TEX / "clouds.png", clouds)
    save_rgba_from_gray(TEX / "ice_overlay.png", ice, (210, 228, 245))
    save_rgba_from_gray(TEX / "shelf_overlay.png", shelf, (168, 150, 110))

    # Preview composite for Blender / QA
    preview = graded.astype(np.float32) / 255.0
    shelf3 = np.array([0.66, 0.58, 0.40], dtype=np.float32)
    ice3 = np.array([0.86, 0.93, 1.0], dtype=np.float32)
    s = shelf[..., None]
    i = ice[..., None]
    preview = preview * (1 - s * 0.85) + shelf3 * s * 0.85
    preview = preview * (1 - i * 0.9) + ice3 * i * 0.9
    save_rgb(TEX / "earth_lgm_preview.jpg", np.clip(preview * 255, 0, 255).astype(np.uint8), quality=90)
    save_rgb(
        TEX / "earth_lgm_preview_2k.jpg",
        np.clip(preview * 255, 0, 255).astype(np.uint8),
        size=(2048, 1024),
        quality=86,
    )

    print("wrote textures to", TEX)
    print("land fraction", float(land.mean()), "ice", float(ice.mean()), "shelf", float(shelf.mean()))


if __name__ == "__main__":
    main()
