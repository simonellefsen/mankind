# MANKIND

An interactive globe of the last two million years: how *Homo sapiens* formed in Africa, how we spread, and how Neanderthals, Denisovans, *Homo floresiensis* (“hobbits”), *Homo luzonensis* and others lived on a planet of ice sheets and drowned land bridges.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3100](http://127.0.0.1:3100).

## Globe pipeline

1. `scripts/generate_maps.py` paints schematic LGM ice and −120 m shelves onto an equirectangular NASA Blue Marble.
2. `blender/texturemapper.py` UV-maps those textures onto a sphere (same lon/lat convention as the web globe) and exports `public/models/globe.glb`.
3. The site renders the maps in Three.js with a matching TextureMapper (`lib/textureMapper.ts`).

Ice and shelves are **schematic**, not a GIS reconstruction. Chapter notes flag where 2024–2026 papers still disagree.

## Stack

Next.js · React Three Fiber · Blender 5 · Vercel
