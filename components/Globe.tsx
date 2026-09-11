"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, useTexture } from "@react-three/drei";
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  FrontSide,
  GLSL1,
  Group,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  SRGBColorSpace,
  ShaderMaterial,
  TubeGeometry,
  Vector3,
} from "three";
import { TextureMapper } from "@/lib/textureMapper";
import { MIGRATIONS, RANGES, SITES, SPECIES, sampleClimate, CHAPTERS, type SpeciesId } from "@/data/story";

const EARTH_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vPosW = w.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const EARTH_FRAG = /* glsl */ `
uniform sampler2D dayMap;
uniform sampler2D iceMap;
uniform sampler2D shelfMap;
uniform sampler2D specMap;
uniform float iceAmount;
uniform float shelfAmount;
uniform vec3 sunDir;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vec3 day = texture2D(dayMap, vUv).rgb;
  day = pow(day, vec3(0.92));
  float ice = texture2D(iceMap, vUv).r * iceAmount;
  float shelf = texture2D(shelfMap, vUv).r * shelfAmount;
  float ocean = texture2D(specMap, vUv).r * (1.0 - clamp(shelf + ice, 0.0, 1.0));
  vec3 shelfCol = vec3(0.62, 0.55, 0.36);
  vec3 iceCol = vec3(0.86, 0.93, 1.0);
  vec3 color = mix(day, mix(day, shelfCol, 0.72), shelf);
  color = mix(color, iceCol, ice * 0.92);
  vec3 n = normalize(vNormalW);
  vec3 light = normalize(sunDir);
  float ndl = dot(n, light);
  float wrap = ndl * 0.55 + 0.45;
  vec3 view = normalize(cameraPosition - vPosW);
  vec3 halfV = normalize(light + view);
  float spec = pow(max(dot(n, halfV), 0.0), 42.0) * ocean * 0.65;
  float fres = pow(1.0 - max(dot(n, view), 0.0), 2.6);
  float night = smoothstep(-0.05, 0.32, ndl);
  color = mix(color * 0.16, color * wrap, night);
  color += spec * vec3(0.75, 0.85, 1.0);
  color += fres * vec3(0.18, 0.32, 0.55) * 0.28;
  gl_FragColor = vec4(color, 1.0);
}
`;

const ATM_VERT = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vPosW = w.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const ATM_FRAG = /* glsl */ `
uniform vec3 glow;
uniform float intensity;
uniform float power;
uniform float inner;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vec3 n = normalize(vNormalW);
  vec3 view = normalize(cameraPosition - vPosW);
  float f = inner > 0.5
    ? pow(max(dot(view, n), 0.0), power)
    : pow(1.0 - abs(dot(view, n)), power);
  gl_FragColor = vec4(glow, 1.0) * f * intensity;
}
`;

let glowTex: CanvasTexture | null = null;
function getGlowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,0.95)");
  grd.addColorStop(0.4, "rgba(255,255,255,0.32)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  glowTex = new CanvasTexture(c);
  return glowTex;
}

function Earth({ ice, shelf }: { ice: number; shelf: number }) {
  const mat = useRef<MeshStandardMaterial>(null);
  const iceAmt = useRef({ value: ice });
  const shelfAmt = useRef({ value: shelf });
  const w = useThree((s) => s.size.width);
  const hi = w > 720;
  const dayUrl = hi ? "/textures/earth.jpg" : "/textures/earth_2k.jpg";
  const [dayMap, iceMap, shelfMap] = useTexture([dayUrl, "/textures/ice.png", "/textures/shelf.png"]);
  dayMap.colorSpace = SRGBColorSpace;
  dayMap.anisotropy = 8;

  useFrame(() => {
    iceAmt.current.value += (ice - iceAmt.current.value) * 0.08;
    shelfAmt.current.value += (shelf - shelfAmt.current.value) * 0.08;
  });

  return (
    <mesh>
      <sphereGeometry args={[1, hi ? 96 : 64, hi ? 64 : 48]} />
      <meshStandardMaterial
        ref={mat}
        map={dayMap}
        roughness={0.62}
        metalness={0.04}
        customProgramCacheKey={() => "mankind-earth-ice-shelf"}
        onBeforeCompile={(shader) => {
          shader.uniforms.iceMap = { value: iceMap };
          shader.uniforms.shelfMap = { value: shelfMap };
          shader.uniforms.iceAmount = iceAmt.current;
          shader.uniforms.shelfAmount = shelfAmt.current;
          shader.fragmentShader = shader.fragmentShader
            .replace(
              "#include <common>",
              `#include <common>
uniform sampler2D iceMap;
uniform sampler2D shelfMap;
uniform float iceAmount;
uniform float shelfAmount;`,
            )
            .replace(
              "#include <map_fragment>",
              `#include <map_fragment>
float iceF = texture2D(iceMap, vMapUv).r * iceAmount;
float shelfF = texture2D(shelfMap, vMapUv).r * shelfAmount;
diffuseColor.rgb = mix(diffuseColor.rgb, mix(diffuseColor.rgb, vec3(0.62, 0.55, 0.36), 0.72), shelfF);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.93, 1.0), iceF * 0.92);`,
            );
        }}
      />
    </mesh>
  );
}

function Atmosphere() {
  return (
    <>
      <mesh scale={1.018}>
        <sphereGeometry args={[1, 64, 48]} />
        <shaderMaterial
          vertexShader={ATM_VERT}
          fragmentShader={ATM_FRAG}
          glslVersion={GLSL1}
          uniforms={{
            glow: { value: new Color("#7db4ff") },
            intensity: { value: 0.55 },
            power: { value: 3.2 },
            inner: { value: 1 },
          }}
          side={BackSide}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.08}>
        <sphereGeometry args={[1, 64, 48]} />
        <shaderMaterial
          vertexShader={ATM_VERT}
          fragmentShader={ATM_FRAG}
          glslVersion={GLSL1}
          uniforms={{
            glow: { value: new Color("#4d7dff") },
            intensity: { value: 0.42 },
            power: { value: 2.4 },
            inner: { value: 0 },
          }}
          side={FrontSide}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

function RangeBlobMesh({
  lon,
  lat,
  rlon,
  color,
  visible,
}: {
  lon: number;
  lat: number;
  rlon: number;
  color: string;
  visible: number;
}) {
  const ref = useRef<Mesh>(null);
  const pos = useMemo(() => TextureMapper.lonLatToVector3(lon, lat, 1.012), [lon, lat]);
  const quat = useMemo(
    () => new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), pos.clone().normalize()),
    [pos],
  );
  const scale = Math.max(0.06, (rlon / 90) * 1.4);
  const tex = useMemo(() => getGlowTexture(), []);
  useFrame(() => {
    if (!ref.current) return;
    const mat = ref.current.material as import("three").MeshBasicMaterial;
    mat.opacity += (visible * 0.58 - mat.opacity) * 0.08;
  });
  return (
    <mesh ref={ref} position={pos} quaternion={quat} scale={[scale, scale, 1]}>
      <planeGeometry args={[1.5, 1.5]} />
      <meshBasicMaterial
        map={tex}
        color={color}
        transparent
        opacity={0}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}

function Ranges({ year, enabled }: { year: number; enabled: Record<SpeciesId, boolean> }) {
  const items = useMemo(() => {
    const out: { key: string; species: SpeciesId; lon: number; lat: number; rlon: number }[] = [];
    (Object.keys(SPECIES) as SpeciesId[]).forEach((id) => {
      const spec = SPECIES[id];
      if (year > spec.from + 20000 || year < Math.max(0, spec.to - 8000)) return;
      const set = RANGES.filter((r) => r.species === id).sort((a, b) => b.year - a.year);
      const row = set.find((r) => r.year <= year) ?? set[0];
      if (!row) return;
      row.blobs.forEach((b, i) =>
        out.push({ key: `${id}-${i}-${row.year}`, species: id, lon: b.lon, lat: b.lat, rlon: b.rlon }),
      );
    });
    return out;
  }, [year]);

  return (
    <>
      {items.map((it) => (
        <RangeBlobMesh
          key={it.key}
          lon={it.lon}
          lat={it.lat}
          rlon={it.rlon}
          color={SPECIES[it.species].color}
          visible={enabled[it.species] ? 1 : 0}
        />
      ))}
    </>
  );
}

function Arc({
  from,
  to,
  via,
  color,
  active,
  sea,
}: {
  from: [number, number];
  to: [number, number];
  via?: [number, number][];
  color: string;
  active: number;
  sea: boolean;
}) {
  const mesh = useRef<Mesh>(null);
  const geo = useMemo(() => {
    const pts: Vector3[] = [];
    const stops: [number, number][] = [from, ...(via ?? []), to];
    for (let s = 0; s < stops.length - 1; s++) {
      const chunk = TextureMapper.greatCircle(stops[s], stops[s + 1], 28, sea ? 0.22 : 0.14);
      if (s > 0) chunk.shift();
      pts.push(...chunk);
    }
    const cat = new CatmullRomCurve3(pts);
    return new TubeGeometry(cat, Math.max(48, pts.length), sea ? 0.006 : 0.0045, 8, false);
  }, [from, to, via, sea]);

  useFrame(() => {
    if (!mesh.current) return;
    const m = mesh.current.material as import("three").MeshBasicMaterial;
    m.opacity += (active * (sea ? 0.92 : 0.72) - m.opacity) * 0.1;
    mesh.current.visible = m.opacity > 0.02;
  });

  return (
    <mesh ref={mesh} geometry={geo}>
      <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
    </mesh>
  );
}

function Arcs({ year, enabled }: { year: number; enabled: Record<SpeciesId, boolean> }) {
  return (
    <>
      {MIGRATIONS.map((m) => {
        const window = m.start - m.end || 1;
        const mid = (m.start + m.end) / 2;
        const dist = Math.abs(year - mid);
        const fade = Math.max(0, 1 - dist / (window * 0.9 + 18000));
        const on = enabled[m.species] ? fade : 0;
        return (
          <Arc
            key={m.id}
            from={m.from}
            to={m.to}
            via={m.via}
            color={SPECIES[m.species].color}
            active={on}
            sea={m.kind === "sea"}
          />
        );
      })}
    </>
  );
}

function Markers({
  year,
  selected,
  onSelect,
}: {
  year: number;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {SITES.map((s) => {
        const live = year <= s.year * 1.85 && year >= s.year * 0.2;
        if (!live && selected !== s.id) return null;
        const p = TextureMapper.lonLatToVector3(s.lon, s.lat, 1.02);
        const hot = selected === s.id;
        return (
          <mesh
            key={s.id}
            position={p}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(s.id);
            }}
          >
            <sphereGeometry args={[hot ? 0.018 : 0.011, 12, 12]} />
            <meshBasicMaterial color={hot ? "#fff6d7" : SPECIES[s.species].color} />
          </mesh>
        );
      })}
    </>
  );
}

function CameraRig({
  lookAt,
  distance,
  dragging,
}: {
  lookAt: [number, number];
  distance: number;
  dragging: React.MutableRefObject<boolean>;
}) {
  const goal = useMemo(
    () => TextureMapper.lonLatToVector3(lookAt[0], lookAt[1], distance),
    [lookAt, distance],
  );
  const { camera } = useThree();
  useFrame((_, dt) => {
    if (dragging.current) return;
    camera.position.lerp(goal, 1 - Math.exp(-dt * 1.55));
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function Scene({
  chapter,
  year,
  enabled,
  playing,
  selectedSite,
  onSelectSite,
}: {
  chapter: number;
  year: number;
  enabled: Record<SpeciesId, boolean>;
  playing: boolean;
  selectedSite: string | null;
  onSelectSite: (id: string) => void;
}) {
  const ch = CHAPTERS[chapter];
  const climate = sampleClimate(year);
  const dragging = useRef(false);
  const group = useRef<Group>(null);
  const w = useThree((s) => s.size.width);

  useFrame((_, dt) => {
    if (!group.current) return;
    if (playing && !dragging.current) group.current.rotation.y += dt * 0.035;
  });

  return (
    <>
      <color attach="background" args={["#05060a"]} />
      <ambientLight intensity={0.42} />
      <directionalLight position={[4, 1.6, 2.4]} intensity={2.1} color={"#fff4e0"} />
      <directionalLight position={[-2.5, -0.6, -1.4]} intensity={0.35} color={"#6f8cff"} />
      <Stars radius={80} depth={40} count={w > 720 ? 2600 : 1100} factor={2.4} fade speed={0.25} />
      <group ref={group}>
        <Earth ice={climate.ice} shelf={climate.shelf} />
        <Atmosphere />
        <Ranges year={year} enabled={enabled} />
        <Arcs year={year} enabled={enabled} />
        <Markers year={year} selected={selectedSite} onSelect={onSelectSite} />
      </group>
      <CameraRig lookAt={ch.lookAt} distance={ch.distance} dragging={dragging} />
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.55}
        maxDistance={4.8}
        rotateSpeed={0.7}
        zoomSpeed={0.7}
        onStart={() => {
          dragging.current = true;
        }}
        onEnd={() => {
          dragging.current = false;
        }}
      />
    </>
  );
}

export function GlobeCanvas(props: {
  chapter: number;
  year: number;
  enabled: Record<SpeciesId, boolean>;
  playing: boolean;
  selectedSite: string | null;
  onSelectSite: (id: string) => void;
}) {
  const cam = TextureMapper.lonLatToVector3(18, 10, 2.6);
  return (
    <Canvas
      camera={{ position: [cam.x, cam.y, cam.z], fov: 42, near: 0.1, far: 200 }}
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      }}
      onPointerMissed={() => props.onSelectSite("")}
    >
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
}
